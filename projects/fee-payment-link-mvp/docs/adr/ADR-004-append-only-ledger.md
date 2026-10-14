# ADR-004: Append-only ledger

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** Fee Payment Link MVP

## Context
If only the current balance is stored, you cannot trace "why this amount", and disputes are hard to resolve when refunds, settlements and corrections overlap.

## Decision
**Only append** every money event to the ledger: `PAYMENT_CAPTURED`, `PLATFORM_FEE_RECOGNIZED`, `REFUND_RESERVED`, `REFUND_COMPLETED`, `SETTLEMENT_RESERVED`, `SETTLEMENT_PAID`, `CHARGEBACK_RECORDED`, `MANUAL_ADJUSTMENT`. Correct with reversing entries, never edits or deletes, and require the operator, reason and related transaction on every manual adjustment.

## Consequences
**Gains**
- Every amount change is traceable, and reconciliation against provider records is easy
- Existing order ledgers stay unchanged even if the product price changes after payment

**Costs and risks**
- Reading a balance requires aggregation (supplemented with snapshots or views when needed)
- Corrections add more entries

## Alternatives considered
- **Updating a balance column (UPDATE):** history disappears, weak for disputes and audit → rejected
- **Full event sourcing:** too much for an MVP → limited to the ledger table

## Related
[ADR-002](ADR-002-verified-webhook-confirmation.md) · [ADR-005](ADR-005-refund-state-machine.md)
