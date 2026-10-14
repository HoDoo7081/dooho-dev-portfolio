# ADR-001: Enforce state values with DB CHECK constraints

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** SilverBridge

## Context
Booking and payment states change in many places in the code. If an application bug or a direct query stores an invalid state value, all later logic is contaminated.

## Decision
Put `CHECK` constraints on the state columns. Bookings allow only `PENDING/CONFIRMED/CANCELLED/COMPLETED/DISPUTED`; payments allow only `INITIATED/PAID/FAILED/REFUNDED/PARTIAL_REFUNDED`.

## Consequences
**Gains**
- No undefined state can be stored, whatever path writes it
- The list of states is documented in the schema, so it can be checked against the API and tests

**Costs and risks**
- Adding a state requires a migration
- `CHECK` cannot enforce the allowed *order of transitions* (covered by service-layer rules)

## Alternatives
Not formally compared. This was set as a design principle from the start: **rules live in the database, not only in application code.** For reference, the two common options and why CHECK fits that principle (noted afterwards, not evaluated at the time):
- **Application enum only:** does not protect against direct DB access or bugs
- **PostgreSQL ENUM type:** changing or removing values is awkward; `CHECK` is easier to evolve

## Related
[schema.sql](../../design-package/02_SQL/schema.sql)
