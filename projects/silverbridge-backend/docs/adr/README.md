# Architecture Decision Records — SilverBridge

A record of the decisions where the senior-travel platform backend design **enforces rules in the DB and the contract**. They expand the key-decisions table in the README with context, consequences and alternatives.

| ADR | Decision | Status |
|---|---|---|
| [001](ADR-001-db-enforced-states.md) | Enforce state values with DB CHECK constraints | Accepted (design stage) |
| [002](ADR-002-duplicate-booking-and-idempotency.md) | Block duplicate bookings twice: UNIQUE constraint + Idempotency-Key | Accepted (design stage) |
| [003](ADR-003-matching-algo-version.md) | Keep `algo_version` on every matching result | Accepted (design stage) |
| [004](ADR-004-role-matrix-and-sos.md) | Role × endpoint permission matrix, with SOS allowed for every role | Accepted (design stage) |
| [005](ADR-005-pii-retention-table.md) | Fix the encryption, retention and disposal table per sensitive field at design time | Accepted (design stage) |

> Format: Context → Decision → Consequences → Alternatives (standard ADR format). These are design-stage decisions made before implementation; status is updated if they change during implementation. Korean originals are in [`ko/`](ko/).

[← Back to the project README](../../README.md)
