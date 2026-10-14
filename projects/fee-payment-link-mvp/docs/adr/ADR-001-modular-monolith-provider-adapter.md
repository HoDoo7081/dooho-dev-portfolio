# ADR-001: Modular monolith + payment-provider adapter

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** Fee Payment Link MVP

## Context
The MVP team is small and shipping speed matters. At the same time the MVP uses Shopify as the payment provider, but it will likely move to a direct domestic PG integration later.

## Decision
Do not split the service into microservices. Build **one deployable unit (a modular monolith)** with the modules Auth, Organization, Campaign, Checkout, Payment, Refund, Settlement, Ledger and Admin. Isolate the payment provider behind an **adapter** outside the domain (Shopify / Mock / a future PG), and keep groups, members, dues, fees and the settlement ledger owned by our own backend.

## Consequences
**Gains**
- Simple to deploy and operate; a single transaction boundary makes ledger consistency easy to guarantee
- Switching providers means changing only the adapter, and the Mock adapter enables testing

**Costs and risks**
- Module boundaries must be held by code discipline (a violated dependency direction lets the monolith clump together)
- If traffic grows, modules will need to be split out; drawing the boundaries from the start is the preparation

## Alternatives considered
- **Microservices:** too much operational burden for the initial team, and payment and ledger would need distributed transactions → rejected
- **Delegating the books to Shopify too:** cannot express group and settlement rules, and creates provider lock-in → rejected

## Related
[ADR-002](ADR-002-verified-webhook-confirmation.md) · [03-ENGINEERING-GUIDE.md](../../03-ENGINEERING-GUIDE.md)
