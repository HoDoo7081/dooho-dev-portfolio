import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db.js';
import { createBooking } from '../src/bookings.js';
import { makeTraveler, makeListingWithSlot, seatsReserved, key } from './helpers.js';

after(() => pool.end());

test('same traveler cannot book the same slot twice (UNIQUE), and the failed attempt does not consume a seat', async () => {
  const t = await makeTraveler();
  const { listingId, slotId } = await makeListingWithSlot({ seats: 5 });
  await createBooking({ idempotencyKey: key(), travelerId: t, listingId, slotId, pax: 2 });
  await assert.rejects(
    createBooking({ idempotencyKey: key(), travelerId: t, listingId, slotId, pax: 2 }),
    { code: 'DUPLICATE_BOOKING' });
  assert.equal(await seatsReserved(slotId), 2);
});

test('10 travelers race for 3 seats: exactly 3 succeed, 7 get SOLD_OUT, counter ends at 3', async () => {
  const { listingId, slotId } = await makeListingWithSlot({ seats: 3 });
  const travelers = await Promise.all(Array.from({ length: 10 }, makeTraveler));
  const results = await Promise.allSettled(travelers.map((t) =>
    createBooking({ idempotencyKey: key(), travelerId: t, listingId, slotId, pax: 1 })));
  const ok = results.filter((r) => r.status === 'fulfilled');
  const soldOut = results.filter((r) => r.status === 'rejected' && r.reason.code === 'SOLD_OUT');
  assert.equal(ok.length, 3);
  assert.equal(soldOut.length, 7);
  assert.equal(await seatsReserved(slotId), 3);
});

test('retry with the same Idempotency-Key returns the original booking and takes seats once', async () => {
  const t = await makeTraveler();
  const { listingId, slotId } = await makeListingWithSlot({ seats: 5 });
  const k = key();
  const args = { idempotencyKey: k, travelerId: t, listingId, slotId, pax: 2 };
  const first = await createBooking(args);
  const second = await createBooking(args);
  assert.equal(first.replayed, false);
  assert.equal(second.replayed, true);
  assert.equal(second.booking.booking_id, first.booking.booking_id);
  assert.equal(await seatsReserved(slotId), 2);
});

test('5 simultaneous retries with one key create exactly one booking', async () => {
  const t = await makeTraveler();
  const { listingId, slotId } = await makeListingWithSlot({ seats: 5 });
  const k = key();
  const rs = await Promise.all(Array.from({ length: 5 }, () =>
    createBooking({ idempotencyKey: k, travelerId: t, listingId, slotId, pax: 1 })));
  assert.equal(new Set(rs.map((r) => r.booking.booking_id)).size, 1);
  assert.equal(rs.filter((r) => !r.replayed).length, 1);
  assert.equal(await seatsReserved(slotId), 1);
});

test('same Idempotency-Key with a different payload is rejected', async () => {
  const t = await makeTraveler();
  const { listingId, slotId } = await makeListingWithSlot({ seats: 5 });
  const k = key();
  await createBooking({ idempotencyKey: k, travelerId: t, listingId, slotId, pax: 1 });
  await assert.rejects(
    createBooking({ idempotencyKey: k, travelerId: t, listingId, slotId, pax: 3 }),
    { code: 'IDEMPOTENCY_KEY_REUSED' });
});

test('database refuses seats_reserved > seats_total even when the app is bypassed', async () => {
  const { slotId } = await makeListingWithSlot({ seats: 2 });
  await assert.rejects(
    pool.query(`UPDATE sb.availability_slots SET seats_reserved = 3 WHERE slot_id=$1`, [slotId]),
    { code: '23514' });
});
