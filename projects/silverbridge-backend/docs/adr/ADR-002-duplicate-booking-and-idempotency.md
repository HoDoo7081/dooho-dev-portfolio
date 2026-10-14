# ADR-002: Block duplicate bookings twice: UNIQUE constraint + Idempotency-Key

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** SilverBridge

## Context
Retries are common on mobile networks, and the same request can repeat when someone books on a senior's behalf. Seats are limited, so a duplicate booking is directly an inventory error.

## Decision
Manage seat inventory in `availability_slots(seats_total, seats_reserved)` and add `UNIQUE(listing_id, slot_id, traveler_id)` on `bookings`. In addition, `POST /v1/bookings` accepts an `Idempotency-Key`, and payment webhooks are handled with signature verification plus a duplicate-event key.

## Consequences
**Gains**
- The DB blocks a duplicate booking of the same slot by the same user
- Retries and webhook redelivery never create duplicate bookings or payments

**Costs and risks**
- Decrementing seats needs separate concurrency control. The current starter only checks remaining seats inside a transaction; applying `SELECT … FOR UPDATE` or an atomic UPDATE is the next step (see the README limits)
- A storage and expiry policy for Idempotency-Keys is also needed

## Alternatives considered
- **Application-level duplicate check only:** breaks under race conditions → rejected
- **Idempotency-Key only:** cannot stop the same booking arriving under different keys → used together with UNIQUE

## Related
[SECURITY.md](../../design-package/04_Security/SECURITY.md) · [bookings.service.ts](../../api-starter/src/modules/bookings/bookings.service.ts)
