# Backend developer assignment brief

<sub>🌐 English · [한국어 원본](ko/02-BACKEND-ASSIGNMENT.md) · [← Project README](README.md)</sub>

## 1. Purpose

Design and implement the core domain of the Fee Payment Link service and the boundary to external payment integration. The evaluation centers not on framework fluency but on amount integrity, state transitions, idempotency, testability and an API contract others can work against.

Estimated net working time: 12–16 hours
Recommended submission window: 5–7 days after receipt
Production deployment: out of scope

## 2. Scope

### Required scenario

1. The treasurer creates a group.
2. Creates a dues campaign with a target settlement amount of 100,000 KRW.
3. The server calculates a fee of 5,000 KRW and a payment amount of 105,000 KRW.
4. Activates the campaign and links the payment provider's product ID.
5. Creates a checkout with member information.
6. Handles a Mock payment-success webhook so the payment status becomes `PAID`.
7. Even if a duplicate webhook arrives, the payment and ledger are not created twice.
8. Fully refunds a payment before settlement.
9. Calculates the settleable amount across several payments and creates a settlement request.
10. Payments included in a settlement request can no longer be auto-refunded.

### Payment provider

`MockPaymentProvider` is the required implementation. Use the interface below or an equivalent abstraction.

```ts
interface PaymentProvider {
  createProduct(input: CreateProductInput): Promise<ProviderProduct>;
  createCheckout(input: CreateCheckoutInput): Promise<ProviderCheckout>;
  refund(input: RefundInput): Promise<ProviderRefund>;
  verifyWebhook(rawBody: Buffer, headers: Record<string, string>): VerifiedWebhook;
}
```

A Shopify development-store integration is optional bonus credit. Do not use real production keys or real card payments.

## 3. Technology choices

- Language and framework are free.
- PostgreSQL or an equivalent relational database is recommended.
- Running locally must be possible with Docker Compose or a single command.
- Include DB migrations.
- Follow the paths, state values and error format of the OpenAPI contract.

## 4. Required data model

The exact table structure is free, but these concepts must be represented.

- `users`: treasurers and operators
- `organizations`: groups
- `campaigns`: dues links
- `payer_profiles`: payer input per campaign
- `payments`: payment attempts and confirmed state
- `refunds`: refund requests and provider results
- `settlements`: settlement-request snapshots
- `settlement_items`: payments included in a settlement
- `ledger_entries`: ledger of amount changes
- `provider_events`: idempotent handling of external webhooks
- `audit_logs`: who changed what

Store amounts as `integer/bigint + KRW`. Do not use `float` or `double`.

## 5. Business rules

- The fee rate is a server setting, 500 bps by default.
- Do not trust `platformFee` or `chargeAmount` sent by the client.
- The price of an active campaign cannot be changed. To change it, close the existing campaign and create a new one.
- Prevent checkout creation beyond campaign capacity, including under concurrency.
- Payment completion is confirmed by a verified webhook, not by a success redirect.
- The webhook event ID must be unique.
- Use an `Idempotency-Key` for refund and settlement requests.
- If an external refund call times out, do not assume failure; leave it in a state that can be re-queried or retried.
- A settlement request freezes its included payments and amounts at creation.
- After a settlement request, refunding the original payment is routed to manual review.

## 6. Authentication scope

The assignment needs no real social login or phone verification.

- `Bearer demo-treasurer-token`: treasurer
- `Bearer demo-admin-token`: operator
- Public campaign lookup and checkout creation are allowed without authentication
- Operator APIs must check the role

Keep authentication logic separate from business logic so it can be replaced with production authentication.

## 7. Required tests

### Unit tests

- 5% amount calculation and rounding down to the won
- Allowed and forbidden state transitions
- Settleable amount calculation
- Auto-refund block after settlement

### Integration tests

- Create campaign → activate → checkout → payment webhook → payment confirmed
- Receiving the same webhook twice is reflected in the ledger once
- Two refund requests with the same `Idempotency-Key` call the provider once
- Invalid webhook signature is rejected
- Concurrent checkout creation does not exceed capacity
- Settlement request amount equals the sum of included payments

## 8. Deliverables

- Source code repository
- `README.md`
- `.env.example`
- DB migrations
- Runnable tests
- API documentation or the result of implementing the supplied OpenAPI
- `DECISIONS.md` explaining key design decisions
- Known limits and what must be fixed before production

The README must state these commands clearly.

```text
Install dependencies
Start the DB
Run migrations
Start the server
Run tests
Reproduce Mock payment success / refund
```

## 9. What you do not have to do

- Connect a real Shopify production store
- Sign a real domestic PG contract or take real card payments
- Real identity verification
- Real bank-account verification and transfers
- An admin frontend
- Recurring auto-payment
- KakaoTalk sending
- Kubernetes and complex cloud infrastructure

## 10. Evaluation criteria

100 points in total.

| Item | Points | What is checked |
|---|---:|---|
| Domain model | 20 | Relationships and states of payment, refund and settlement |
| Amount integrity | 20 | Server calculation, ledger, transactions, concurrency |
| External integration design | 15 | Provider abstraction, failure and retry handling |
| API quality | 15 | OpenAPI conformance, consistent errors, pagination |
| Tests | 20 | Tests that actually verify the core risks |
| Documentation and readability | 10 | How to run, decisions, code structure |

### Deductions

- Storing card data directly
- Using floating point for amounts
- Treating a redirect alone as payment success
- No webhook signature or duplicate handling
- All business logic concentrated in controllers
- Tests that only check the happy path
- Committing production secrets to the repository

## 11. Review interview questions

- If an external refund succeeds but the response is never received, how do you recover?
- How do you handle two concurrent requests to pay for the last remaining seat?
- If an order is cancelled in Shopify but internal webhook handling fails, how do you reconcile?
- If a chargeback occurs after settlement is complete, which ledger events are needed?
- When removing Shopify and integrating a domestic PG directly, how far does the change reach?
- If a personal-data deletion request conflicts with the obligation to retain accounting and transaction records, how do you separate the data?

## 12. Running the assignment fairly

- Do not require features beyond the assignment's scope.
- Publish the passing criteria and estimated time before evaluation.
- If a submission will be used in a real product, tell candidates in advance and make it paid work.
- Copying, distributing or commercially using the code of rejected candidates is prohibited.
