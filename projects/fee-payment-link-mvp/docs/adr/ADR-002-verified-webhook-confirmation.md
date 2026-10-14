# ADR-002: Confirm payment with a verified webhook, not a redirect

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** Fee Payment Link MVP

## Context
The payment-success URL (a browser redirect) can be closed or tampered with by the user, and webhooks can be redelivered, duplicated or arrive out of order. In a money-handling service, if the standard for "paid" wobbles, duplicate payments and omissions follow.

## Decision
Use the browser success URL **only to inform the user**, and confirm payment **only through a signature-verified webhook**. The order is: verify signature → begin transaction → **insert first** `provider_event(event_id)` (on conflict treat it as a duplicate, return 200 and stop) → lock the payment row → validate amount, currency and campaign → transition to `PAID` + append ledger entries → commit. Provider order ID and transaction ID get unique indexes.

## Consequences
**Gains**
- A duplicate webhook is reflected as a payment only once (success metric: zero duplicate payments)
- Confirmation happens at one fixed point, which makes audit and reconciliation easy

**Costs and risks**
- If the webhook is delayed, the user's screen and the state briefly disagree, so a "confirming" state message is needed
- Needs the discipline of storing the raw webhook for audit but never storing card data

## Alternatives considered
- **Confirm on the redirect URL:** vulnerable to tampering and interruption → rejected
- **Periodic polling only:** large delay and more provider calls → used only as a supporting mechanism (reconciliation)

## Related
[ADR-004](ADR-004-append-only-ledger.md) · [01-PRD.md](../../01-PRD.md)
