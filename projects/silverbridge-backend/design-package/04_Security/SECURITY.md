# Security and permissions design

<sub>🌐 English · [한국어 원본](../ko/04_Security/SECURITY.md)</sub>

## 1) Role permission matrix (summary)

| Endpoint | TRAVELER | HOST | ADMIN | ASSISTANT |
|---|---|---|---|---|
| GET /v1/listings | R | R | R | R |
| POST /v1/bookings | C | - | - | - |
| POST /v1/payments/sessions | C | - | - | - |
| POST /v1/messages/threads | C | C | C | C |
| GET/POST /v1/messages/{threadId} | R/W (own threads) | R/W (own threads) | R/W | R/W |
| POST /v1/reviews | C (own bookings only) | - | - | - |
| POST /v1/assistants/assign | - | - | C | C (needs approval) |
| POST /v1/concierge/sessions | - | - | - | C |
| POST /v1/safety/sos | C | C | C | C |
| GET /v1/admin/audit | - | - | R | - |

- R = Read, C = Create, W = Write/Update, `-` = no access

## 2) Sensitive data, retention / disposal, encryption

| Table.column | Class | Encryption / masking | Retention | Disposal |
|---|---|---|---|---|
| users.phone | Personal data | Encrypted at rest (KMS), masked in responses | 3 years after withdrawal | Periodic physical deletion |
| messages.body | General (conversation) | Stored | 1 year | Bulk deletion after the retention period |
| payments.provider_txn_id | Financial | Encrypted at rest | 5 years for accounting audit | Disposal log |
| user_locations.latitude/longitude | Location | Stored | 6 months | Anonymize / delete |
| audit_logs.* | Log | Stored | 1 year | Rolling deletion |

## 3) Authentication and authorization
- JWT (Bearer), expiry 1 h / refresh 14 d
- Role and ownership checks: bookings, messages, reviews and similar are accessible only to the owner
- Admin functions require a separate scope (`role=ADMIN`)

## 4) Input validation, rate limiting, idempotency
- DTO schema validation on every endpoint
- `Idempotency-Key` is strongly recommended on `/v1/bookings`
- Payments and webhooks use signature verification and a duplicate-event key
