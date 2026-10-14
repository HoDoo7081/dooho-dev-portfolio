import { pool } from '../src/db.js';
let n = 0;
const uid = () => `${process.pid}-${Date.now()}-${++n}`;

export async function makeTraveler() {
  const u = (await pool.query(
    `INSERT INTO sb.users(email, full_name, role, status) VALUES ($1,'Test Traveler','TRAVELER','ACTIVE') RETURNING user_id`,
    [`t-${uid()}@example.test`])).rows[0];
  await pool.query(`INSERT INTO sb.travelers(traveler_id) VALUES ($1)`, [u.user_id]);
  return u.user_id;
}

export async function makeListingWithSlot({ seats = 5, price = 30000 } = {}) {
  const hu = (await pool.query(
    `INSERT INTO sb.users(email, full_name, role, status) VALUES ($1,'Test Host','HOST','ACTIVE') RETURNING user_id`,
    [`h-${uid()}@example.test`])).rows[0];
  await pool.query(`INSERT INTO sb.hosts(host_id) VALUES ($1)`, [hu.user_id]);
  const l = (await pool.query(
    `INSERT INTO sb.listings(host_id, type, title, base_price, currency, capacity, status)
     VALUES ($1,'TOUR','Test tour',$2,'KRW',10,'ACTIVE') RETURNING listing_id`, [hu.user_id, price])).rows[0];
  const s = (await pool.query(
    `INSERT INTO sb.availability_slots(listing_id, start_ts, end_ts, seats_total, seats_reserved)
     VALUES ($1, NOW()+interval '7 day', NOW()+interval '7 day 3 hour', $2, 0) RETURNING slot_id`, [l.listing_id, seats])).rows[0];
  return { listingId: l.listing_id, slotId: s.slot_id };
}

export const seatsReserved = async (slotId) =>
  Number((await pool.query(`SELECT seats_reserved FROM sb.availability_slots WHERE slot_id=$1`, [slotId])).rows[0].seats_reserved);
export const key = () => `idem-${uid()}`;
export const txnId = () => `txn-${uid()}`;
export const eventId = () => `evt-${uid()}`;
