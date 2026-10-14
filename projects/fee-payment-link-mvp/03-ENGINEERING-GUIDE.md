# Backend engineering guide

<sub>🌐 English · [한국어 원본](ko/03-ENGINEERING-GUIDE.md) · [← Project README](README.md)</sub>

## 1. Recommended architecture

Start with a modular monolith, not microservices.

```text
API
 ├─ Auth
 ├─ Organization
 ├─ Campaign
 ├─ Checkout
 ├─ Payment
 ├─ Refund
 ├─ Settlement
 ├─ Ledger
 └─ Admin
       ↓
Application Services
       ↓
Domain + Repository Interfaces
       ↓
PostgreSQL / Shopify Adapter / Mock Provider
```

Keeping the payment provider out of the domain lets you replace Shopify with a direct domestic PG integration after the MVP.

## 2. Shopify mapping

| Internal concept | Shopify concept | Note |
|---|---|---|
| Dues campaign | Product | A product that needs no shipping |
| Dues price | Product Variant | Single KRW price |
| Payment attempt | Cart/Checkout | Pass the internal payment ID as an attribute |
| Payment completed | Order + paid transaction | Confirmed by webhook |
| Full refund | Refund or Order cancel | Refund to the original payment method |
| Partial refund | Refund | Outside the MVP UI scope |

Recommended metadata:

```text
organization_id
campaign_id
payment_id
net_amount
platform_fee
schema_version
```

Do not put personal data in the product name. Never put a member's name or phone number in the product name, URL or Shopify tags.

## 3. Shopify creation flow

```text
Create campaign as DRAFT
→ finalize internal amounts
→ Provider.createProduct()
→ store providerProductId/providerVariantId
→ switch campaign to ACTIVE
→ activate the public link
```

Do not wait on external product creation for a long time inside a DB transaction. The recommended approach:

1. Save the internal campaign as `DRAFT`.
2. Run the external product-creation job.
3. On success, record the provider IDs and switch to `ACTIVE`.
4. On failure, keep it `DRAFT` and make it retryable.

## 4. Payment confirmation principles

- The success URL in the browser is for informing the user.
- Confirm payment after webhook signature verification.
- Put unique indexes on provider order ID and transaction ID.
- Insert the webhook event ID first; if it is a duplicate, return a success response and stop.
- Bind event handling and ledger updates into one DB transaction.

Pseudocode:

```text
verify signature
begin transaction
  insert provider_event(event_id) on conflict do nothing
  if duplicate: commit and return 200
  lock payment row
  validate amount/currency/campaign
  transition payment to PAID
  append ledger entries
  mark provider_event processed
commit
```

## 5. Ledger design

Do not store only the current balance; record money events in an append-only ledger.

Example ledger types:

- `PAYMENT_CAPTURED`
- `PLATFORM_FEE_RECOGNIZED`
- `REFUND_RESERVED`
- `REFUND_COMPLETED`
- `SETTLEMENT_RESERVED`
- `SETTLEMENT_PAID`
- `CHARGEBACK_RECORDED`
- `MANUAL_ADJUSTMENT`

Never delete or edit ledger entries; add reversing entries. A manual adjustment must record the operator, the reason and the related transaction.

## 6. Refund design

An external API call and a DB write cannot be made into one atomic transaction, so you need a state machine and idempotency keys.

```text
PAID
→ REFUND_PENDING
→ external refund call
→ success confirmed
→ REFUNDED + ledger entry
```

On timeout, do not return to `FAILED` immediately. Confirm the final state through a provider refund ID lookup or a reconciliation job.

From 2026-04, Shopify's GraphQL `refundCreate` requires an idempotency directive, so pin the API version in use and its requirements. Re-check the latest official Shopify documentation at implementation time.

## 7. Settlement design

Do not manage the settleable amount only as a cached value.

```text
Settleable amount = net amount of confirmed payments
                    − net amount of completed / reserved refunds
                    − net amount reserved in earlier settlement requests
                    − operational holds
```

When creating a settlement:

- Lock the target payment rows.
- Check whether any is already included in another settlement.
- Save the settlement and settlement_items together.
- Append `SETTLEMENT_RESERVED` to the ledger.
- If the computed result and the item total do not match, roll everything back.

## 8. API rules

- Amounts: integer KRW
- IDs: UUID
- Dates: ISO 8601 UTC
- Lists: use either cursor-based or page-based pagination, consistently
- Error response: `code`, `message`, `requestId`, `details`
- Write requests: support `Idempotency-Key`
- Tracing: `X-Request-Id` on every response

Values to ignore or reject even if the client sends them:

- Platform fee
- Final payment amount
- Payment-success state
- Settleable amount
- Refund-completed state

## 9. Security

- Never receive or store card numbers, CVC or card PINs on the server.
- Manage the Shopify Admin token and webhook secret in a secret manager or environment variables.
- Use the raw request body, before parsing, for webhook verification.
- Mask names, phone numbers, account numbers and tokens in logs.
- Use unguessable tokens, not sequential numbers, for public link IDs.
- Leave an audit log for manual operator status changes.
- Apply role checks to the refund, settlement and provider-resync APIs.

## 10. Failures and reconciliation

Consider a reconciliation job, at least once a day, that finds these mismatches.

- Shopify shows payment completed but the internal state is `PENDING`
- Shopify shows refund completed but the internal state is `REFUND_PENDING`
- Internal payment amount differs from the Shopify order amount
- An active campaign has no provider order ID
- Settlement item total differs from the settlement request amount

For the MVP assignment, an admin `reconcile` service and its tests can stand in for a real scheduler.

## 11. Environments

```text
local: MockPaymentProvider
test: MockPaymentProvider + fixed clock
staging: Shopify development store
production: approved Shopify store + domestic PG
```

Keep separate Shopify stores and webhook secrets for development, staging and production.

## 12. Pre-deployment checklist

- DB backup and restore drill
- Webhook replay tool
- Duplicate-event test
- Shopify API rate-limit handling
- Refund timeout recovery
- Amount and currency validation
- Personal-data masking
- Admin permission checks
- Refund-after-settlement policy applied
- Product / order / internal ledger reconciliation
- Production secrets not exposed
