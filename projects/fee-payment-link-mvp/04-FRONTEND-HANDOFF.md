# Frontend parallel-development guide

<sub>🌐 English · [한국어 원본](ko/04-FRONTEND-HANDOFF.md) · [← Project README](README.md)</sub>

## 1. Principles

The frontend develops against `openapi.yaml` without waiting for the backend to be finished. Screens must not finalize fees or settleable amounts themselves; they display the server response.

A 5% amount pre-computed in the frontend may be used only as an input aid. The `amounts` in the dues-creation response are the final values.

## 2. Recommended screens

### Treasurer area

| Screen | Example path | Main API |
|---|---|---|
| Login | `/login` | demo token in the assignment |
| Group list | `/dashboard` | `GET /v1/organizations` |
| Create group | `/organizations/new` | `POST /v1/organizations` |
| Group detail | `/organizations/:id` | `GET /v1/organizations/:id`, campaigns |
| Create dues | `/organizations/:id/campaigns/new` | `POST /v1/organizations/:id/campaigns` |
| Manage dues | `/campaigns/:id` | `GET /v1/campaigns/:id`, payments |
| Confirm refund | `/payments/:id/refund` | `POST /v1/payments/:id/refunds` |
| Request settlement | `/organizations/:id/settlements/new` | summary, settlements list and create |

### Member area

| Screen | Example path | Main API |
|---|---|---|
| Public dues page | `/pay/:slug` | `GET /v1/public/campaigns/:slug` |
| Payer information | `/pay/:slug/payer` | local form |
| Go to payment | `/pay/:slug/checkout` | `POST /v1/public/campaigns/:slug/checkouts` |
| Payment result | `/pay/result` | `GET /v1/public/payments/:publicToken` |

## 3. Core components

- `Money`: KRW thousands separators; keep input value and display value separate
- `CampaignStatusBadge`
- `PaymentStatusBadge`
- `SettlementStatusBadge`
- `FeeBreakdown`: target settlement amount, service fee, final charge
- `PaymentTable`: search, status filter, pagination
- `RefundDialog`: shows whether a refund is possible, with warnings
- `SettlementSummary`: available, requested, paid out
- `AsyncState`: loading, empty, error, retry

## 4. Dues creation form

Fields:

- Group ID
- Dues name
- Description
- Treasurer's target settlement amount
- Due date
- Maximum number of payers
- Label for an extra identifier to collect from payers, e.g. student number
- Refund-policy notice

Amount entry example:

```text
Amount the treasurer receives     100,000 KRW
Platform service fee                5,000 KRW
Member's final payment            105,000 KRW
```

In copy, use "platform service fee" instead of "card fee".

## 5. Handling the payment result

Right after the Shopify success redirect, the internal state may still be `PENDING` for a moment.

Recommended UX:

```text
"We are confirming your payment."
→ poll the status up to 5 times, 2 seconds apart
→ if PAID, show the completion screen
→ if still PENDING, show "Payment being confirmed" and a link to check later
```

The frontend must not display `PAID` just because it saw the success URL.

## 6. Refund UX

Buttons by state:

- `PAID` and not in a settlement: enable the refund request
- `REFUND_PENDING`: disable the button and show "in progress"
- `REFUNDED`: show the refund completion date
- In a settlement: show customer-support guidance instead of an automatic refund button

Generate a new `Idempotency-Key` for each refund request. Reuse the same key for network retries.

## 7. Mock data examples

### Campaign

```json
{
  "id": "8a224e83-1d43-4e46-9d53-f4d98e24c920",
  "organizationId": "bd6f3e48-a465-4401-b471-c32b593346f8",
  "name": "2026 Fall Semester Dues",
  "description": "Photography club operations and exhibition preparation costs",
  "slug": "photo-club-2026-fall-x7k2",
  "status": "ACTIVE",
  "amounts": {
    "netAmount": 100000,
    "platformFeeRateBps": 500,
    "platformFee": 5000,
    "chargeAmount": 105000,
    "currency": "KRW"
  },
  "dueAt": "2026-09-30T14:59:59Z",
  "capacity": 30,
  "paidCount": 12
}
```

### Payer list item

```json
{
  "id": "6d87a317-edc4-4d51-af39-9534d38fd9b2",
  "payerName": "Gildong Hong",
  "payerIdentifier": "20261234",
  "status": "PAID",
  "chargeAmount": 105000,
  "netAmount": 100000,
  "paidAt": "2026-07-20T05:20:11Z",
  "refundEligibility": "ELIGIBLE"
}
```

### Error

```json
{
  "code": "CAMPAIGN_CAPACITY_EXCEEDED",
  "message": "The maximum number of payers has been reached.",
  "requestId": "req_01J2ABCDXYZ",
  "details": {}
}
```

## 8. Error codes that must be handled

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CAMPAIGN_NOT_ACTIVE`
- `CAMPAIGN_EXPIRED`
- `CAMPAIGN_CAPACITY_EXCEEDED`
- `PAYMENT_NOT_REFUNDABLE`
- `PAYMENT_ALREADY_REFUNDED`
- `SETTLEMENT_LOCKED`
- `IDEMPOTENCY_CONFLICT`
- `PAYMENT_PROVIDER_UNAVAILABLE`

## 9. Accessibility and mobile criteria

- Core payment information must not be cut off at 360 px width.
- Do not distinguish amounts by color alone.
- Include text in status badges.
- Show input errors next to the field and in a summary at the top.
- Prevent double clicks on the go-to-payment button.
- Tell the user they are being taken to an external payment screen.

## 10. Frontend definition of done

- The whole treasurer flow runs against a Mock API
- The public link runs through to the move to payment
- A screen exists for every state value
- Loading, empty-list, server-error and retry states exist
- When the server amount and the local preview disagree, the server value is used
- Mobile screens verified
- API base URL and demo token are separated into environment variables
