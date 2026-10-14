# ADR-006: Freeze settlements as a snapshot; block refunds after settlement

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** Fee Payment Link MVP

## Context
If refunds remain possible after a settlement request, the money already sent to the treasurer and the books diverge. And if the list of settlement targets changes after the request, amount disputes follow.

## Decision
Compute the settleable amount as `PAID − REFUNDED − amount already included in a settlement`, and **freeze the target payment list and amounts as a snapshot when the settlement request is created**. Payments bundled into a settlement at `REQUESTED` or beyond are **not auto-refunded** (refund after settlement is blocked).

## Consequences
**Gains**
- Less room for disputes over settlement amounts, and no double payout
- "Refund-after-settlement block test" is written into the launch-approval conditions

**Costs and risks**
- The exception where a refund is needed after settlement must be handled through a separate operating procedure (manual adjustment)
- If settlement is delayed, the refund-blocked period can get long

## Alternatives considered
- **Allow auto-refund even after settlement:** ledger mismatch and clawback problems → rejected
- **Recompute targets on every lookup after settlement:** the amount could change → rejected

## Related
[ADR-005](ADR-005-refund-state-machine.md) · [01-PRD.md](../../01-PRD.md), launch-approval conditions
