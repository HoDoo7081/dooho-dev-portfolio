# Worked example — discovery to implementation decision

[Portfolio](../README.md) · [Playbooks](README.md) · [Technical proof](../projects/silverbridge-backend/reference-impl/README.md)

**Fictional customer exercise.** The customer, conversations, owners and proposed acceptance criteria below are illustrative. Technical evidence links point to the existing SilverBridge proof; they do not establish that this fictional engagement occurred.

## Customer brief

A small travel marketplace wants to accept bookings for limited-capacity activities and confirm payment reliably. Its operations team is concerned about overselling, repeated payment notifications and refunds releasing capacity twice. The decision is whether to fund a bounded implementation pilot.

## Discovery findings and unanswered questions

| Question | Exercise assumption | Still needed before implementation |
|---|---|---|
| What must never happen? | Overselling or duplicate processing of one provider event | Customer-approved financial and inventory rules |
| Who owns inventory? | Marketplace PostgreSQL database | Reservation expiry, cancellation and external inventory policy |
| Who confirms payment? | Signed provider webhook | Provider contract, signature format, event ordering and retry policy |
| What does operations need? | Understand exceptions and reconcile payments | Support ownership, reconciliation frequency and escalation SLA |
| What is the baseline? | Not supplied | Real incident counts, volumes and operational time; no ROI claim yet |
| Which controls apply? | Role separation and minimal sensitive data | Security/privacy review, access provisioning and retention decisions |

## Proposed solution and trade-offs

Use the database to enforce capacity and allowed transitions, persist idempotency keys for booking retries, verify webhook signatures and process provider event IDs once. Explain errors to operations through an agreed support workflow.

| Decision | Why | Cost or remaining question |
|---|---|---|
| Atomic capacity update | Concurrent requests cannot independently claim the same remaining seats | One-database concurrency proof does not establish distributed inventory behavior |
| Database constraints and triggers | Invalid states remain blocked when callers bypass the application | Schema migrations and operational recovery require care |
| Persistent idempotency | Retries have a stable server-side result | Retention and key scope need a production policy |
| Signed mock provider for PoC | Demonstrates signature and duplicate-event handling without live payments | Does not validate an actual provider, timestamp freshness or key rotation |
| AWS reference path | Makes deployment and migration assumptions explicit | The existing AWS proof was deployed once and destroyed; no running production service |

## Traceability and PoC acceptance

These are proposed criteria for this exercise. Existing tests provide limited technical evidence, not customer acceptance.

| Requirement | Proposed acceptance | Existing evidence | Production gap |
|---|---|---|---|
| Avoid overselling | Ten simultaneous requests for three seats yield three successful reservations | Booking concurrency tests | Peak-load model and distributed failure scenarios |
| Safe booking retry | Same key/payload returns the original result; changed payload rejected | Idempotency tests | Authenticated user scoping and expiry policy |
| Authentic notification | Invalid signature produces no payment mutation | Signature tests | Real provider specification and secret rotation |
| Safe duplicate delivery | Eight deliveries of one event cause one processing operation | Duplicate webhook test | Provider-scoped identifiers and retention review |
| Refund consistency | Two competing full refunds release seats once | Refund concurrency test | Provider refund execution and reconciliation |
| Controlled lifecycle | Forbidden state transitions rejected through raw SQL | Transition test | Administrative recovery and audit process |

## Delivery plan with gates

| Gate | Deliverable | Proposed owner | Exit condition |
|---|---|---|---|
| Discovery | Approved scope, financial rules and dependency list | Customer sponsor + consultant | Open assumptions assigned and prioritized |
| Technical validation | Reproducible proof and gap review | Technical lead | Agreed scenarios demonstrated; failures documented |
| Pilot design | Provider sandbox, identity, observability and data policy | Engineering + security + operations | Controls and pilot responsibilities approved |
| UAT | Normal, duplicate, failure and recovery scenarios | Customer process owner | Acceptance recorded and blocking defects resolved |
| Launch decision | Cutover, rollback, support and reconciliation plan | Delivery lead + sponsor | Named decision authority accepts remaining risk |

## Risks and next decision

| Risk | Mitigation / decision |
|---|---|
| Provider behavior differs from the mock | Confirm API contract and run sandbox integration before committing to delivery dates |
| Team interprets paid/confirmed/refunded differently | Approve a shared state model before implementation |
| Retry behavior hides an unresolved payment | Define reconciliation and manual escalation paths |
| PoC mistaken for production readiness | Review each gap above at the pilot gate |

**Recommendation:** use the existing proof to evaluate core booking/payment invariants, then make pilot funding conditional on provider, identity and operational readiness. Measure customer value during the pilot against an agreed baseline.
