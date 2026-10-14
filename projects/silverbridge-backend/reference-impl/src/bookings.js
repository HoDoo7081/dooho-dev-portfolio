import { createHash } from 'node:crypto';
import { tx, DomainError } from './db.js';

const hash = (o) => createHash('sha256').update(JSON.stringify(o)).digest('hex');

/**
 * Create a booking. Safe to retry: the same Idempotency-Key with the same payload returns the original booking.
 * Rules enforced:
 *   1. seats are reserved with ONE atomic conditional UPDATE (no read-then-write race)
 *   2. UNIQUE(listing_id, slot_id, traveler_id) blocks a second booking of the same slot by the same traveler
 *   3. a failure at any step rolls back the seat reservation
 */
export async function createBooking({ idempotencyKey, travelerId, listingId, slotId, pax }) {
  const reqHash = hash({ travelerId, listingId, slotId, pax });
  return tx(async (c) => {
    // First writer wins; a concurrent duplicate blocks here until the first transaction commits.
    const ins = await c.query(
      `INSERT INTO sb.idempotency_keys(idem_key, request_hash) VALUES ($1,$2)
       ON CONFLICT (idem_key) DO NOTHING RETURNING idem_key`, [idempotencyKey, reqHash]);
    if (ins.rowCount === 0) {
      const prev = await c.query(
        `SELECT k.request_hash, b.* FROM sb.idempotency_keys k
           LEFT JOIN sb.bookings b ON b.booking_id = k.booking_id WHERE k.idem_key=$1`, [idempotencyKey]);
      const row = prev.rows[0];
      if (row.request_hash !== reqHash)
        throw new DomainError('IDEMPOTENCY_KEY_REUSED', 'Idempotency-Key was already used with a different request');
      return { booking: row, replayed: true };
    }

    const seat = await c.query(
      `UPDATE sb.availability_slots SET seats_reserved = seats_reserved + $2
        WHERE slot_id=$1 AND listing_id=$3 AND seats_reserved + $2 <= seats_total
        RETURNING slot_id`, [slotId, pax, listingId]);
    if (seat.rowCount === 0) throw new DomainError('SOLD_OUT', 'Not enough seats left in this slot');

    const listing = await c.query(`SELECT base_price, currency FROM sb.listings WHERE listing_id=$1`, [listingId]);
    const { base_price, currency } = listing.rows[0];
    const subtotal = Number(base_price) * pax;

    let booking;
    try {
      booking = (await c.query(
        `INSERT INTO sb.bookings(traveler_id, listing_id, slot_id, pax, status, subtotal_amount, fees_amount, total_amount, currency)
         VALUES ($1,$2,$3,$4,'PENDING',$5,0,$5,$6) RETURNING *`,
        [travelerId, listingId, slotId, pax, subtotal, currency])).rows[0];
    } catch (e) {
      if (e.code === '23505') throw new DomainError('DUPLICATE_BOOKING', 'This traveler already booked this slot');
      throw e;
    }
    await c.query(`UPDATE sb.idempotency_keys SET booking_id=$2 WHERE idem_key=$1`, [idempotencyKey, booking.booking_id]);
    return { booking, replayed: false };
  });
}

/** Open a payment attempt for a booking (amount is computed server-side from the booking). */
export async function createPaymentSession({ bookingId, provider, providerTxnId }) {
  return tx(async (c) => {
    const b = (await c.query(`SELECT total_amount, currency, status FROM sb.bookings WHERE booking_id=$1`, [bookingId])).rows[0];
    if (!b || b.status !== 'PENDING') throw new DomainError('BOOKING_NOT_PAYABLE', 'Booking is not payable');
    return (await c.query(
      `INSERT INTO sb.payments(booking_id, method, provider, provider_txn_id, amount, currency, status)
       VALUES ($1,'CARD',$2,$3,$4,$5,'INITIATED') RETURNING *`,
      [bookingId, provider, providerTxnId, b.total_amount, b.currency])).rows[0];
  });
}

/** Refund a paid booking once: payment PAID->REFUNDED, booking CONFIRMED->CANCELLED, seats released. */
export async function refundBooking({ bookingId }) {
  return tx(async (c) => {
    const p = (await c.query(
      `SELECT * FROM sb.payments WHERE booking_id=$1 AND status='PAID' FOR UPDATE`, [bookingId])).rows[0];
    if (!p) throw new DomainError('NOT_REFUNDABLE', 'No paid payment to refund (already refunded or never paid)');
    await c.query(`UPDATE sb.payments SET status='REFUNDED' WHERE payment_id=$1`, [p.payment_id]);
    const b = (await c.query(`UPDATE sb.bookings SET status='CANCELLED' WHERE booking_id=$1 RETURNING slot_id, pax`, [bookingId])).rows[0];
    await c.query(`UPDATE sb.availability_slots SET seats_reserved = seats_reserved - $2 WHERE slot_id=$1`, [b.slot_id, b.pax]);
    return { refunded: true };
  });
}
