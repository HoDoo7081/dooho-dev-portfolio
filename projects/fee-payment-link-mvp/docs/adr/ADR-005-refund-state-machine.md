# ADR-005: Refunds as a state machine with idempotency keys; timeouts settled by reconciliation

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** Fee Payment Link MVP

## Context
An external API call and a write to our own DB cannot share one transaction. If the call times out it may actually have succeeded, so treating it as a failure immediately causes double refunds and mismatches.

## Decision
Split the refund into steps: `PAID → REFUND_PENDING → (external refund call) → success confirmed → REFUNDED + ledger entry`. Use an **idempotency key** on the request, **do not return to FAILED immediately on timeout**, and settle the final state through a provider-refund-ID lookup and reconciliation job. The ledger is not marked as reduced before the refund succeeds, and only one in-flight refund is allowed per payment.

## Consequences
**Gains**
- Designed toward zero mismatches between refund requests and provider status (a success metric)
- Money does not leave twice even during an outage

**Costs and risks**
- The intermediate state (`REFUND_PENDING`) can last long, so an operator screen and alerts are needed
- The reconciliation job must run without fail (an operational responsibility)

## Alternatives considered
- **Decide the state right after a synchronous call:** weak against timeouts and partial failures → rejected
- **Auto-fail on timeout:** risk of double refund → rejected

## Related
[ADR-004](ADR-004-append-only-ledger.md) · [ADR-006](ADR-006-settlement-snapshot.md)
