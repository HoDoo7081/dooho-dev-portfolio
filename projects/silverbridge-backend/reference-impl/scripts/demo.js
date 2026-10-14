// ~90-second narrated walkthrough for a screen recording. Run: npm run db:setup && npm run demo
import { createBooking, createPaymentSession, refundBooking } from '../src/bookings.js';
import { handlePaymentWebhook, sign } from '../src/webhooks.js';
import { pool } from '../src/db.js';
import { makeTraveler, makeListingWithSlot, seatsReserved, key, txnId, eventId } from '../test/helpers.js';

const say = (s) => console.log(`\n\x1b[1m▶ ${s}\x1b[0m`);
const ok = (s) => console.log(`  \x1b[32m✔\x1b[0m ${s}`);
const SECRET = 'demo-secret';
const status = async (t, c, id) => (await pool.query(`SELECT status FROM sb.${t} WHERE ${c}=$1`, [id])).rows[0].status;

const { listingId, slotId } = await makeListingWithSlot({ seats: 3, price: 30000 });

say('1. Ten travelers race for the last 3 seats');
const travelers = await Promise.all(Array.from({ length: 10 }, makeTraveler));
const rs = await Promise.allSettled(travelers.map((t) => createBooking({ idempotencyKey: key(), travelerId: t, listingId, slotId, pax: 1 })));
ok(`${rs.filter((r) => r.status === 'fulfilled').length} confirmed, ${rs.filter((r) => r.status === 'rejected').length} sold out, seats_reserved = ${await seatsReserved(slotId)} / 3`);

say('2. Same traveler books the same slot again');
const second = await makeListingWithSlot({ seats: 5, price: 30000 });
const t = await makeTraveler();
const { booking } = await createBooking({ idempotencyKey: key(), travelerId: t, ...second, pax: 2 });
await createBooking({ idempotencyKey: key(), travelerId: t, ...second, pax: 2 }).catch((e) => ok(`blocked by the database: ${e.code}`));

say('3. Payment webhook delivered 8 times');
const providerTxnId = txnId();
const payment = await createPaymentSession({ bookingId: booking.booking_id, provider: 'mockpay', providerTxnId });
const raw = JSON.stringify({ id: eventId(), type: 'payment.succeeded', provider_txn_id: providerTxnId, amount: 60000, currency: 'KRW' });
const results = await Promise.all(Array.from({ length: 8 }, () => handlePaymentWebhook({ secret: SECRET, rawBody: raw, signature: sign(SECRET, raw) })));
ok(`processed once, ${results.filter((r) => r.duplicate).length} duplicates ignored → payment ${await status('payments', 'payment_id', payment.payment_id)}, booking ${await status('bookings', 'booking_id', booking.booking_id)}`);

say('4. Refund, then try to resurrect the payment with raw SQL');
await refundBooking({ bookingId: booking.booking_id });
ok(`payment ${await status('payments', 'payment_id', payment.payment_id)}, booking ${await status('bookings', 'booking_id', booking.booking_id)}, seats released → ${await seatsReserved(second.slotId)}`);
await pool.query(`UPDATE sb.payments SET status='PAID' WHERE payment_id=$1`, [payment.payment_id]).catch((e) => ok(`database refused: ${e.message}`));
await pool.end();
