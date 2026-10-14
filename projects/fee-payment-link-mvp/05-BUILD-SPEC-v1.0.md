# Build specification v1.0 — "Modu-ui Hoebi" (all-members dues)

<sub>[← Fee Payment Link](README.md) · [PRD](01-PRD.md) · [Engineering guide](03-ENGINEERING-GUIDE.md) · [Launch program](program/README.md)</sub>

English summary of my backend build specification, **v1.0, dated 2026-07-20**, the hand-off baseline for backend developers, QA and operations. The Korean original is the working document; this page keeps the decisions, invariants and acceptance criteria and leaves out business-sensitive detail.

> [!IMPORTANT]
> **Status, as the spec itself states it:** the front end exists as a Lovable project and a **Shopify adapter is implemented**; **no domestic PG contract is signed**, and the in-memory repository is **demo-only** (a relational database is required before production). I have not published that code, and this page is a summary of the specification, not evidence of production use. The spec forbids enabling real domestic payments until the PG approves the collection-and-settlement structure in writing.

## How v1.0 differs from the earlier PRD

The product was sharpened between the first PRD and this spec. Both are kept in this repo so the change is visible.

| Topic | Earlier PRD ([01-PRD.md](01-PRD.md)) | Build spec v1.0 |
|---|---|---|
| Who creates links | Treasurer signs up and creates a group and links | **No treasurer sign-up in the MVP.** The treasurer submits a request; an **operator reviews it** and issues the link |
| Fee | Fixed default of 500 bps (5%) | Operator sets the fee per request: 6% general, 4% pilot, custom 0–20% or a fixed amount; **a loss warning and re-confirmation** appear when the fee is below break-even |
| Price changes | Server calculates; ledger is append-only | **Pricing snapshot is locked at issue.** After issue, price is never edited: deactivate the unpaid link and issue a new one with a new `pricingVersion` |
| Settlement | Snapshot; no refund after settlement | Operator-approved, **manual bank transfer first** (transfer slip attached), reconciliation, separate creator and approver; refund after settlement goes to a **recovery / offset queue** |
| Provider | Shopify as order engine, adapter planned | `PaymentProvider` interface (create link, get payment, refund, deactivate link, verify webhook); Shopify adapter now, Toss Payments / PortOne later |
| Gate | Launch conditions list | **Release block:** no production payments without the PG's written approval and the open contract values |

## Core flow

`Request (SUBMITTED) → operator review (APPROVED / REJECTED) → fee set → pricing snapshot locked → link issued (idempotent) → payer pays → verified webhook → payer list → refund (operator-approved) → settlement (approve → manual transfer → reconcile)`

## Invariants (Appendix A of the spec)

1. A success redirect is **not** payment confirmation.
2. An issued pricing snapshot is immutable.
3. A webhook changes nothing until it is verified and de-duplicated.
4. Cumulative refunds can never exceed the amount paid.
5. Settlement is computed only from the confirmed ledger.
6. Secrets and card data never reach the client or the logs.
7. A manual operator change is impossible without an audit-log entry.
8. Without domestic-PG approval, production payments stay disabled.

## Data model and API (summary)

- **Entities:** AdminRequest, PricingSnapshot, PaymentLink, PayerSubmission, Payment, Refund, Settlement, WebhookEvent, AuditLog. Provider IDs are unique; amounts, rates, refund policy and consent text are snapshotted at transaction time.
- **Public API (6):** submit request, request status, link info, create payment attempt, request refund, webhook receiver (raw-body HMAC).
- **Admin API (10):** list and approve requests, pricing preview, issue and deactivate links, refunds, settlement draft / approve / mark-paid, payer export (permission and reason required).
- **Idempotency:** every external-effect `POST` requires an `Idempotency-Key`; same key and payload returns the original result, same key and different payload returns `409`.
- **Webhooks:** verify HMAC on raw bytes, claim the event, update the ledger, and write an outbox row in one transaction; monotonic state transitions so out-of-order delivery cannot regress state; retries with backoff and a dead-letter state; daily reconciliation against the provider statement.

## Acceptance (Definition of Done, abridged)

- Operator enters a rate; fee, total, estimated PG cost and margin are computed automatically; the server rejects a client-calculated value that differs.
- Pricing snapshot locked at issue; no edits after the first payment.
- **HMAC verification and DB-backed idempotency are proven by tests.**
- Full and partial refunds, including refund-after-settlement exceptions.
- Payer list, refunds and settlement ledger reconcile with the provider statement.
- PII encrypted and masked; no secrets in logs; every admin action in the audit log.
- A real small-amount payment → cancel → settlement passes end-to-end in staging.

## End-to-end scenarios (8)

| ID | Scenario | Pass criterion |
|---|---|---|
| E2E-01 | 100,000 KRW at 6% | 106,000 KRW product, link and snapshot agree |
| E2E-02 | 100,000 KRW at 4% pilot | 104,000 KRW, cost warning shown, issue succeeds |
| E2E-03 | 0% fee | strong loss warning and operator re-confirmation |
| E2E-04 | Same issue request sent twice | no duplicate product or link |
| E2E-05 | Success webhook delivered twice | exactly one payment recorded |
| E2E-06 | Full and partial refund | external and internal cumulative amounts match |
| E2E-07 | Settlement create → approve → transfer → reconcile | list, ledger and transfer amount agree |
| E2E-08 | Attempt to change price | blocked; a new version must be issued |

E2E-04, 05 and a state-machine subset are the same rules demonstrated on PostgreSQL in the [SilverBridge reference implementation](../silverbridge-backend/reference-impl/README.md); this project's own implementation tests are not published.

## Known open items (from §18 of the spec)

Actual card fee and VAT, settlement cycle, fee refund on cancellation, guarantee insurance and limits, KYC requirements for individual treasurers, installments, merchant category code, chargeback liability, and the operating company's legal details and policies. The spec treats these as release blockers.
