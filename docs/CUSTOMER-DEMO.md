# Five-minute customer solution demonstration

[Portfolio](../README.md) · [Worked discovery case](../playbooks/worked-example-travel-marketplace.md) · [Existing recorded walkthrough](../projects/silverbridge-backend/reference-impl/demo-walkthrough.mp4)

**Prepared talk track, not a completed customer presentation.** The customer scenario is fictional. Run the existing demonstration against a disposable PostgreSQL database using the reference implementation instructions. The implementation calls domain functions directly; it has no HTTP endpoint, real payment provider or application authentication.

## Before presenting

- Review [setup instructions and limits](../projects/silverbridge-backend/reference-impl/README.md). Database setup recreates the `sb` schema: use a scratch database only.
- Run the tests, then `npm run demo` in `projects/silverbridge-backend/reference-impl`.
- Open the [payment flow](../projects/fee-payment-link-mvp/docs/images/02-payment-confirmation-flow.png), [source](../projects/silverbridge-backend/reference-impl/src/webhooks.js) and [AWS architecture](../projects/silverbridge-backend/aws-reference-architecture/README.md).
- Keep the recorded walkthrough available if the local environment fails. State when showing a recording.

## 0:00–0:45 — Establish the business decision

“Imagine your operations team sells activities with limited seats. Repeated booking requests and payment notifications must not turn into overselling or repeated processing. Before proposing a solution, I would confirm who owns inventory, how your payment provider retries events, and what your support team needs to reconcile exceptions. Today I will show a small proof of those rules and the work still needed before a pilot.”

## 0:45–1:30 — Explain the proposed design

“The database owns capacity and lifecycle constraints. Booking retries use an idempotency key. Payment confirmation comes from a verified provider event, not a browser success page. The proof uses a signed mock provider, so it demonstrates our processing logic without claiming a live payment integration.”

Point to the flow and identify the external provider, verification boundary, database transaction and resulting states. Ask: “Does this match the source of truth in your current process?”

## 1:30–2:45 — Show execution and interpret it

Run `npm run demo` and explain the actual observed output:

1. Ten travelers compete for three seats. Count successful reservations and remaining capacity. The script's word “confirmed” refers to successful reservations here, not paid/confirmed booking status.
2. A repeated traveler/slot booking is rejected by the database constraint.
3. One valid webhook is delivered eight times. Show one processed event, duplicate results and the payment/booking states.
4. Refund the booking and attempt an illegal transition through SQL. Show released capacity and the database rejection.

“The value is preserving inventory and payment consistency under these specific retries and races. These scenarios do not yet establish throughput, real-provider reliability or customer ROI.”

## 2:45–3:45 — Handle a technical objection

**Customer:** “A valid signature means the notification is safe forever, right?”

“It establishes authenticity and payload integrity with the shared secret. Here, an already recorded event ID is ignored. A production integration also needs the provider's timestamp policy, key rotation and event retention rules. I would verify those before signing off the integration.”

**Customer:** “What if the amount is wrong?”

“The handler checks amount and currency against the stored payment. A mismatch fails the transaction. I would next agree how operations sees that failure and reconciles it with the provider.”

## 3:45–4:30 — Discuss deployment and limits

“There is an AWS reference architecture and a recorded one-time deployment proof: all 13 existing tests passed against RDS in Seoul, after which the stack was destroyed. The team MVP uses Supabase; it is a separate implementation. The next pilot needs an HTTP layer, identity, provider sandbox integration, monitoring, reconciliation and support ownership.”

## 4:30–5:00 — Close with a decision

“I propose a scoped pilot after we confirm the provider contract and security requirements. We would agree representative success and failure scenarios, assign UAT and operational owners, then decide whether to proceed using recorded results. Which exception creates the greatest operational burden today?”

## Preparation questions

- Explain the transaction boundary and the behavior when processing fails after event insertion.
- Distinguish an event-ID duplicate from a second event about the same payment.
- Explain where user authentication and authorization would enter the design.
- Explain a design alternative and why this limited proof uses database constraints.
- Identify what you personally authored, what AI assisted with and what the team built.
