# RAID log — Fee Payment Link

<sub>[← Launch program](README.md)</sub>

Planned log at program start. Probability / impact: H / M / L. Status values are initial, not outcomes.

## Risks

| ID | Risk | P | I | Mitigation | Trigger / early signal | Owner | Status |
|---|---|:-:|:-:|---|---|---|---|
| R1 | Provider or Shopify does not allow an individual treasurer to collect and settle dues | M | H | Ask in W0 in writing; keep the provider behind an adapter so a domestic PG can replace Shopify | No written answer by end of W2 | PM | Open |
| R2 | Partial cancellation not supported | M | M | MVP is full-refund-before-settlement only (already the policy); document the limit | Provider test shows partial cancel rejected | Backend | Open |
| R3 | Duplicate webhook or race double-counts a payment | M | H | Event-ID-first insert, unique indexes, duplicate-webhook test as an M1 gate | Test red, or reconciliation diff ≠ 0 | Backend | Open |
| R4 | Provider refund times out and state diverges from ledger | M | H | `REFUND_PENDING` + reconciliation job; ledger changes only after confirmed refund | Pending refunds older than N minutes | Backend | Open |
| R5 | Platform-fee tax / VAT display is wrong | M | H | Single recorded `platformFee` in MVP; separate tax review before M7 | Finance review not scheduled by M3 | PM | Open |
| R6 | Personal data over-collected or logged in plaintext | L | H | Privacy criteria in the operations doc; log review in M5 | Log sample shows names / phone numbers | Backend | Open |
| R7 | Treasurer cannot create a link in 3 minutes (usability) | M | M | Prototype test with 3 treasurers before M3; measure time-to-link in beta | Median > 3 min in test | Frontend | Open |
| R8 | Beta clubs too few or drop out | M | M | Recruit 5 for 3; line up 2 in W6 | < 3 committed by W10 | PM | Open |
| R9 | Single-point knowledge (one backend engineer) | M | M | ADRs and engineering guide are the hand-off; pair on ledger and refund code | Any module with one reviewer | PM | Open |

## Assumptions

| ID | Assumption | If wrong | Validate by |
|---|---|---|---|
| A1 | Team of ~1 PM, 1–2 backend, 1 frontend, part-time operator for ~17 weeks | Re-plan; cut settlement polish first | W0 staffing confirmation |
| A2 | Full refund before settlement is enough for beta | Add partial refund (new milestone) | Beta feedback |
| A3 | Beta clubs accept a card fee shown as "platform service" | Revisit pricing copy and fee model | M6 interviews |
| A4 | KRW only, integer amounts | Currency model rework | Scope sign-off at M0 |

## Issues (open at start)

| ID | Issue | Impact | Owner | Next step |
|---|---|---|---|---|
| I1 | PG and Shopify fee tables not yet confirmed | Blocks fee formula sign-off | PM | Obtain documents in W1 |
| I2 | Operator reconciliation is a requirement but has no screen design | M4 scope unclear | PM + Operator | CSV-first scope, agree in W3 |

## Dependencies

| ID | Dependency | Provider | Needed by | Lead time |
|---|---|---|---|---|
| D1 | Written approval of the collection / settlement model | Provider / Shopify | M1 start | Long, external |
| D2 | Fee tables and tax treatment | Finance / accountant | M3 | Medium |
| D3 | Terms, privacy policy, refund policy | Legal | M6 | Medium |
| D4 | Test-mode accounts and webhook secrets | Provider | M1 | Short |
| D5 | Beta clubs | Community / sales | M6 | Medium |
