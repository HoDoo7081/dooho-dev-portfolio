import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db.js';
import { createBooking, createPaymentSession, refundBooking } from '../src/bookings.js';
import { handlePaymentWebhook, sign } from '../src/webhooks.js';
import { makeTraveler, makeListingWithSlot, seatsReserved, key, txnId, eventId } from './helpers.js';

after(() => pool.end());
const SECRET = 'test-webhook-secret';

async function pendingPayment({ seats = 5, pax = 2 } = {}) {
  const t = await makeTraveler();
  const { listingId, slotId } = await makeListingWithSlot({ seats, price: 30000 });
  const { booking } = await createBooking({ idempotencyKey: key(), travelerId: t, listingId, slotId, pax });
  const providerTxnId = txnId();
  const payment = await createPaymentSession({ bookingId: booking.booking_id, provider: 'mockpay', providerTxnId });
  return { booking, payment, providerTxnId, slotId };
}
const event = (id, providerTxnId, amount, currency = 'KRW') =>
  JSON.stringify({ id, type: 'payment.succeeded', provider_txn_id: providerTxnId, amount, currency });
const deliver = (raw, secret = SECRET) =>
  handlePaymentWebhook({ secret: SECRET, rawBody: raw, signature: sign(secret, raw) });
const statusOf = async (table, col, id) =>
  (await pool.query(`SELECT status FROM sb.${table} WHERE ${col}=$1`, [id])).rows[0].status;

test('verified webhook moves payment to PAID and booking to CONFIRMED', async () => {
  const { booking, payment, providerTxnId } = await pendingPayment();
  const r = await deliver(event(eventId(), providerTxnId, 60000));
  assert.equal(r.duplicate, false);
  assert.equal(await statusOf('payments', 'payment_id', payment.payment_id), 'PAID');
  assert.equal(await statusOf('bookings', 'booking_id', booking.booking_id), 'CONFIRMED');
});

test('the same webhook delivered 8 times in parallel is processed exactly once', async () => {
  const { payment, providerTxnId } = await pendingPayment();
  const raw = event(eventId(), providerTxnId, 60000);
  const rs = await Promise.all(Array.from({ length: 8 }, () => deliver(raw)));
  assert.equal(rs.filter((r) => !r.duplicate).length, 1);
  assert.equal(rs.filter((r) => r.duplicate).length, 7);
  const ev = await pool.query(`SELECT count(*)::int n FROM sb.provider_events WHERE event_id=$1`, [JSON.parse(raw).id]);
  assert.equal(ev.rows[0].n, 1);
  assert.equal(await statusOf('payments', 'payment_id', payment.payment_id), 'PAID');
});

test('a bad signature is rejected and nothing changes', async () => {
  const { payment, providerTxnId } = await pendingPayment();
  const raw = event(eventId(), providerTxnId, 60000);
  await assert.rejects(deliver(raw, 'wrong-secret'), { code: 'INVALID_SIGNATURE' });
  assert.equal(await statusOf('payments', 'payment_id', payment.payment_id), 'INITIATED');
});

test('an amount that differs from the server-side price is rejected', async () => {
  const { payment, providerTxnId } = await pendingPayment();
  await assert.rejects(deliver(event(eventId(), providerTxnId, 100)), { code: 'AMOUNT_MISMATCH' });
  assert.equal(await statusOf('payments', 'payment_id', payment.payment_id), 'INITIATED');
});

test('refund: PAID -> REFUNDED, booking CANCELLED, seats released; a second refund is refused', async () => {
  const { booking, payment, providerTxnId, slotId } = await pendingPayment({ pax: 2 });
  await deliver(event(eventId(), providerTxnId, 60000));
  assert.equal(await seatsReserved(slotId), 2);
  await refundBooking({ bookingId: booking.booking_id });
  assert.equal(await statusOf('payments', 'payment_id', payment.payment_id), 'REFUNDED');
  assert.equal(await statusOf('bookings', 'booking_id', booking.booking_id), 'CANCELLED');
  assert.equal(await seatsReserved(slotId), 0);
  await assert.rejects(refundBooking({ bookingId: booking.booking_id }), { code: 'NOT_REFUNDABLE' });
  assert.equal(await seatsReserved(slotId), 0);
});

test('database rejects illegal transitions even with raw SQL (REFUNDED -> PAID, CANCELLED -> CONFIRMED)', async () => {
  const { booking, payment, providerTxnId } = await pendingPayment();
  await deliver(event(eventId(), providerTxnId, 60000));
  await refundBooking({ bookingId: booking.booking_id });
  await assert.rejects(
    pool.query(`UPDATE sb.payments SET status='PAID' WHERE payment_id=$1`, [payment.payment_id]), { code: '23514' });
  await assert.rejects(
    pool.query(`UPDATE sb.bookings SET status='CONFIRMED' WHERE booking_id=$1`, [booking.booking_id]), { code: '23514' });
});

test('two refunds racing for one payment: exactly one wins and seats are released once', async () => {
  const { booking, providerTxnId, slotId } = await pendingPayment({ pax: 2 });
  await deliver(event(eventId(), providerTxnId, 60000));
  const rs = await Promise.allSettled([
    refundBooking({ bookingId: booking.booking_id }),
    refundBooking({ bookingId: booking.booking_id })]);
  assert.equal(rs.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(await seatsReserved(slotId), 0);
});
