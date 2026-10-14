import { createHmac, timingSafeEqual } from 'node:crypto';
import { tx, DomainError } from './db.js';

export const sign = (secret, rawBody) => createHmac('sha256', secret).update(rawBody).digest('hex');

function verify(secret, rawBody, signature) {
  const expected = Buffer.from(sign(secret, rawBody), 'hex');
  const given = Buffer.from(String(signature || ''), 'hex');
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    throw new DomainError('INVALID_SIGNATURE', 'Webhook signature does not match');
}

/**
 * Confirm a payment from a provider webhook. Order matters (see fee-payment-link ADR-001/002):
 *   verify signature -> insert event id first -> lock payment -> validate amount -> transition -> mark processed
 * A redelivered event returns { duplicate: true } and changes nothing.
 */
export async function handlePaymentWebhook({ secret, rawBody, signature, provider = 'mockpay' }) {
  verify(secret, rawBody, signature);
  const evt = JSON.parse(rawBody);
  return tx(async (c) => {
    const first = await c.query(
      `INSERT INTO sb.provider_events(event_id, provider, event_type) VALUES ($1,$2,$3)
       ON CONFLICT (event_id) DO NOTHING RETURNING event_id`, [evt.id, provider, evt.type]);
    if (first.rowCount === 0) return { duplicate: true };

    if (evt.type === 'payment.succeeded') {
      const p = (await c.query(
        `SELECT * FROM sb.payments WHERE provider=$1 AND provider_txn_id=$2 FOR UPDATE`, [provider, evt.provider_txn_id])).rows[0];
      if (!p) throw new DomainError('UNKNOWN_PAYMENT', 'No payment for this provider transaction');
      if (Number(p.amount) !== Number(evt.amount) || p.currency.trim() !== evt.currency)
        throw new DomainError('AMOUNT_MISMATCH', 'Amount or currency differs from what the server expected');
      if (p.status === 'INITIATED') {
        await c.query(`UPDATE sb.payments SET status='PAID', paid_at=NOW() WHERE payment_id=$1`, [p.payment_id]);
        await c.query(`UPDATE sb.bookings SET status='CONFIRMED' WHERE booking_id=$1 AND status='PENDING'`, [p.booking_id]);
      }
    }
    await c.query(`UPDATE sb.provider_events SET processed_at=NOW() WHERE event_id=$1`, [evt.id]);
    return { duplicate: false };
  });
}
