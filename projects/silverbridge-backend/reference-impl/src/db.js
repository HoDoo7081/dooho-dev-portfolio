import pg from 'pg';
export const pool = new pg.Pool({ max: 30 }); // PG* env vars
export async function tx(fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
export class DomainError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
