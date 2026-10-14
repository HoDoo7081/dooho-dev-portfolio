# Architecture Decision Records — Fee Payment Link MVP

A record of decisions about **"what has to be nailed down first?"** in a service that handles money. Each ADR expands a key design decision in the README with context, consequences and alternatives.

| ADR | Decision | Status |
|---|---|---|
| [001](ADR-001-modular-monolith-provider-adapter.md) | Modular monolith + payment-provider adapter | Accepted (design stage) |
| [002](ADR-002-verified-webhook-confirmation.md) | Confirm payment with a verified webhook, not a redirect | Accepted (design stage) |
| [003](ADR-003-integer-krw-bps-fee.md) | Integer KRW + bps fee; only the server computes amounts | Accepted (design stage) |
| [004](ADR-004-append-only-ledger.md) | Append-only ledger | Accepted (design stage) |
| [005](ADR-005-refund-state-machine.md) | Refunds as a state machine with idempotency keys; timeouts settled by reconciliation | Accepted (design stage) |
| [006](ADR-006-settlement-snapshot.md) | Freeze settlements as a snapshot; block refunds after settlement | Accepted (design stage) |

> Format: Context → Decision → Consequences → Alternatives (standard ADR format). These are design-stage decisions made before implementation; status is updated if they change during implementation. Korean originals are in [`ko/`](ko/).

[← Back to the project README](../../README.md)
