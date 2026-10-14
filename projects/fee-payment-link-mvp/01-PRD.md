# Fee Payment Link MVP: PRD

<sub>🌐 English · [한국어 원본](ko/01-PRD.md) · [← Project README](README.md)</sub>

Document version: 0.1
As of: 2026-07-20
Status: draft for the development assignment and MVP design

## 1. Product overview

A service where the treasurer of a club, society or student council sets up dues or an event fee, gets a card-payable link, and manages payment status, refunds and expected settlement.

The platform uses Shopify as the order and payment-state engine. The service's own groups, members, dues, fees and settlement ledger are managed in our own backend.

## 2. The problem

- The treasurer has to check cash or bank-transfer records one by one.
- Payers cannot pay dues by card.
- It is hard to manage who has paid and who has not.
- When an event is cancelled, refund records and the settlement ledger are separate.
- When the treasurer changes, past dues and payment records are hard to hand over.

## 3. Goals

### Product goals

- The treasurer creates a one-off dues link within 3 minutes.
- Members complete payment on mobile web without signing up.
- A completed payment appears in the payer list within 1 minute.
- For payments before settlement, the treasurer can request a full refund.
- Every amount change is tracked as an immutable ledger event.

### MVP success metrics

- Link creation success rate ≥ 99%
- Successful-payment webhook reflection rate ≥ 99.9%
- Zero duplicate payments caused by duplicate webhooks
- Zero mismatches between refund requests and payment-provider refund status
- Average time for a treasurer to find a payer ≤ 10 seconds

## 4. Users

### Treasurer

- An individual user who may have no business registration.
- Creates groups and dues, and shares the link.
- Checks payment status and requests refunds and settlement.

### Payer

- Opens the payment link without signing up for an app.
- Enters name, contact and member identifier, and pays by card.
- Checks the payment result and refund status.

### Operator

- Reviews groups, abnormal payments, refunds and settlement requests.
- Holds a campaign or settlement when needed.
- Checks mismatches between payment-provider orders and the internal ledger.

## 5. Core user flows

### 5.1 Treasurer sign-up and group creation

1. The treasurer completes mobile phone identity verification.
2. Registers name and settlement-account information in their own name.
3. Enters group name, group type, affiliation and description.
4. Agrees to the operating policy and the settlement / refund terms.
5. In the MVP assignment, identity verification and account verification need not be integrated externally and can be simulated with a `VERIFIED` test state.

### 5.2 Creating a dues link

1. The treasurer enters the dues name, target settlement amount, due date, capacity and description.
2. The server calculates the platform fee and the member's payment amount.
3. The treasurer confirms the final payment amount.
4. The server creates a Shopify product / variant.
5. The campaign is activated and a share link is returned.

### 5.3 Member payment

1. The member opens the public payment link.
2. Checks the dues name, group name, amount and refund terms.
3. Enters name, contact and an optional identifier.
4. The server creates a payment attempt and returns the Shopify checkout URL.
5. The member pays on the Shopify and domestic PG screens.
6. After the Shopify webhook arrives, the payment status changes to `PAID`.

### 5.4 Refund

1. The treasurer selects a payment.
2. The server checks settlement status and any existing refund.
3. Before settlement, it changes the status to `REFUND_PENDING` and requests a full refund from the payment provider.
4. It marks the payment `REFUNDED` based on a success webhook or lookup result.
5. After settlement, it does not refund automatically and returns `MANUAL_REVIEW_REQUIRED`.

### 5.5 Settlement request

1. The treasurer checks the settleable amount.
2. Creates a settlement request.
3. The server freezes the target payments into the settlement request.
4. The operator approves or rejects.
5. In the MVP, no actual bank transfer is made; the status can be switched to `PAID` manually.

## 6. Amount policy

All amounts are stored as integer KRW with no decimals.

```text
platformFee = floor(netAmount × platformFeeRateBps ÷ 10,000)
chargeAmount = netAmount + platformFee
```

- Default `platformFeeRateBps`: 500
- `netAmount`: the amount the treasurer wants to receive
- `platformFee`: the platform service fee
- `chargeAmount`: the final amount shown to the member

Example:

```json
{
  "netAmount": 100000,
  "platformFeeRateBps": 500,
  "platformFee": 5000,
  "chargeAmount": 105000,
  "currency": "KRW"
}
```

The payment screen does not use the phrase "card fee". It clearly shows the final payment amount and a price that includes the platform service.

The final accounting presentation of actual PG cost, Shopify cost and VAT follows a separate tax policy. In the MVP, `platformFee` is recorded as a single value.

## 7. State model

### Campaign

- `DRAFT`: being written, payment not possible
- `ACTIVE`: link payment possible
- `CLOSED`: closed, no new payments
- `CANCELLED`: cancelled by the operator or the treasurer

### Payment

- `PENDING`: checkout created, payment not yet confirmed
- `PAID`: payment confirmed
- `REFUND_PENDING`: refund requested
- `PARTIALLY_REFUNDED`: partly refunded; not created in the MVP UI
- `REFUNDED`: fully refunded
- `FAILED`: payment failed or expired

### Settlement

- `AVAILABLE`: can be requested
- `REQUESTED`: requested by the treasurer
- `PROCESSING`: approved by the operator and being processed
- `PAID`: recorded as paid out
- `REJECTED`: rejected
- `BLOCKED`: held due to a refund, dispute or operating policy

## 8. Functional requirements

### Required

- Treasurer login and minimal profile
- Group creation and lookup
- Dues campaign creation, activation and closing
- Server-side calculation of the 5% service fee
- Public campaign lookup
- Checkout creation
- Shopify or Mock payment-provider adapter
- Payment success, failure and refund webhooks
- Payer list and search
- Full refund request
- Settleable amount calculation
- Settlement request and operator status change
- Audit log
- OpenAPI documentation
- Automated tests

### Later

- Recurring auto-payment and billing keys
- Partial-refund UI
- Actual bank transfers
- Multiple treasurers and permissions
- KakaoTalk notifications
- Automatic reminders to non-payers
- PDF receipts
- Products beyond dues, such as group buying and tickets
- Native app

## 9. Non-functional requirements

- Trust only the server for amount calculation.
- Every creation, refund and settlement request supports idempotency.
- Verify webhook signatures.
- Record the raw webhook and its result for audit. Do not store card data.
- Never leave personal data or bank account numbers in logs in plaintext.
- Store time in UTC in the DB and return ISO 8601 from the API.
- Payment completion is based on a verified webhook, not on a client redirect.
- An outage at an external provider must not corrupt internal transactions.

## 10. Refund and settlement rules

- Only a `PAID` payment can be refunded.
- Only one in-flight refund is allowed per payment.
- A payment not included in a settlement request can be refunded automatically.
- A payment bundled into a settlement at `REQUESTED` or beyond is not auto-refunded.
- The ledger is not marked as reduced before the refund succeeds.
- Settleable amount is `PAID − REFUNDED − amount already included in a settlement`.
- When a settlement request is created, the target payments and amounts are frozen as a snapshot.

## 11. Operating and regulatory assumptions

- Final accounting accounts (loans, deposits received, revenue recognition) follow existing expert opinion and the company's accounting policy.
- When contracting with Shopify and a domestic PG, disclose the business model of collecting and settling dues for non-business individual treasurers and obtain approval.
- Review the terms of service, privacy policy, refund policy and treasurer settlement contract separately before a real launch.
- This PRD is a product and technical document and does not replace legal or tax advice.

## 12. Launch-approval conditions

- Shopify test payment succeeds
- Full card cancellation succeeds
- Confirm whether partial cancellation is possible and decide the policy
- Duplicate-webhook test passes
- Existing order ledger stays unchanged even if the product price changes after a successful payment
- Refund-after-settlement block test passes
- PG and Shopify fee tables confirmed
- Operator reconciliation screen or CSV is available
