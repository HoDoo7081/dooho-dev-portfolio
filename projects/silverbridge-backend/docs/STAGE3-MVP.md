# SilverBridge Stage 3 — what the team actually shipped

<sub>[← SilverBridge case study](../README.md) · [Portfolio home](../../../README.md)</sub>

The design package in this repo (31-table schema, OpenAPI contract, NestJS starter) is **Stage 2**. In Stage 3 the team had to put a working app in front of judges and pilot users within weeks, and **re-baselined the scope**. This page documents what actually shipped, what stayed design-only, and why. Nothing here is rounded up.

> [!NOTE]
> Source for this page: the team's final submission package (app test report, backend guide, final result report, pitch deck) and a read-through of the MVP source. Credentials, project URLs and keys, the APK and keystore, team member names and the expense ledger are **intentionally not published**.

## 1. Result in one table

| | Stage 2 design (this repo) | Stage 3 MVP (shipped) |
|---|---|---|
| **Client** | Not specified (UI kit draft) | React 18 + Vite + TypeScript + Tailwind + shadcn/ui, packaged with **Capacitor 7** as an **Android APK**; screens generated with Figma Make (AI-assisted) |
| **Backend** | NestJS + Prisma on AWS | **Supabase**: Auth (JWT), Storage, Realtime, and one **Edge Function** (Deno + Hono) in the Tokyo region |
| **Data** | 31 relational tables, CHECK / UNIQUE constraints | **Key-value store** (`kv_store`) — JSON documents under prefixed keys (e.g. `user:…`) |
| **API** | OpenAPI 3, 14 paths, `/v1/…` | **36 routes** on one Edge Function (list in §3) |
| **AI** | Matching engine (design) | Chat assistant route calling an LLM API; a translate route |
| **Status of requirement set** | 38 requirements traced to screens, APIs and entities — all marked *design complete* | Feature subset implemented (§2) |

Why the change: a small team and a fixed demo date. Supabase removed the need to host and secure a NestJS service, and the KV store removed migrations. The cost was giving up the relational guarantees the design depends on. The change was recorded as a change log in the team's design package (*Backend design change log*), which is the evidence for the re-baselining decision.

## 2. Implemented vs design-only

| Capability | Status | Notes |
|---|---|---|
| Sign-up / sign-in, session (Supabase Auth) | ✅ Implemented | Traveler, host (guide), consultant roles |
| Guide product list / detail / search by city | ✅ Implemented | Seeded demo data |
| Booking create, list, update status | ✅ Implemented — **minimal** | See gaps in §4 |
| Trips, wishlist, reviews (with photo upload) | ✅ Implemented | Storage bucket for uploads |
| Chat messages, consultations with assignment and status | ✅ Implemented | Consultant dashboard stats route |
| AI chat assistant, translate | ✅ Implemented | LLM key held server-side |
| Host profile | ✅ Implemented | |
| Seat inventory (`availability_slots`) and duplicate-booking protection | ❌ Design-only | Only a max-group-size check exists |
| Payments, signed webhooks, refunds | ❌ Design-only | No payment provider integrated in the MVP |
| Safety: SOS, check-ins, location sharing | ⚠️ UI flow only | No end-to-end backend behaviour verified |
| Matching with `algo_version` | ❌ Design-only | |
| Row-level security, audit log, PII retention jobs | ❌ Design-only | Listed as non-functional requirements |

## 3. Shipped API surface (36 routes, one Edge Function)

| Area | Routes |
|---|---|
| System | `GET /health` · `POST /auth/create-demo-accounts` · `POST /init-demo-guides` |
| Auth & users | `POST /auth/signup` · `GET /auth/session` · `GET·PUT /users/:userId` |
| Trips & wishlist | `GET·POST /trips` · `PUT /trips/:tripId` · `GET·POST /wishlist` · `DELETE /wishlist/:itemId` |
| Reviews | `GET·POST /reviews` · `POST /reviews/upload` |
| Chat & AI | `GET·POST /chats/:chatId/messages` · `POST /ai/chat` · `POST /translate` |
| Consultations | `GET·POST /consultations` · `POST /consultations/:id/assign` · `PUT /consultations/:id/status` · `GET·POST /consultations/:id/messages` · `GET /consultant/stats` |
| Guide marketplace | `GET·POST /guide-products` · `GET·PUT·DELETE /guide-products/:id` · `GET·POST /guide-bookings` · `PUT /guide-bookings/:id` · `GET /hosts/:id/profile` |

## 4. Honest gap table: documents vs code

I read the Edge Function source against the team's own documents. The submission documents describe the app more strongly than the code supports. This is the kind of drift a TPM or architect should catch, so I list it.

| Document claim | What the code does | Risk | Fix (design already exists) |
|---|---|---|---|
| "Bookings are inserted into the `bookings` table" | Bookings are JSON values in the KV store | No constraints, no joins, no reporting | Move to the `sb.bookings` schema in [`schema.sql`](../design-package/02_SQL/schema.sql) |
| Duplicate-booking prevention | Not implemented; only max group size is checked | The same traveler can book the same slot repeatedly | `UNIQUE(listing_id, slot_id, traveler_id)` + `Idempotency-Key` ([reference implementation](../reference-impl/README.md)) |
| Booking update by owner | `PUT` merges arbitrary fields from the request body | **Mass assignment**: a client can change price or status | Allow-list of mutable fields; state machine ([ADR-001](adr/ADR-001-db-enforced-states.md)) |
| JWT-protected API | Auth is checked, but CORS is `*` | Broader than needed for a mobile app | Restrict origins; separate public and authenticated routes |
| Test report: all five core flows 100% | Flows work on the happy path with seeded data | No negative tests, no concurrency tests | Added in the reference implementation tests |

## 5. App screens (from the team's test report)

![Stage 3 app screens: guide list, guide detail, booking form, upcoming trips](images/08-stage3-app-screens.png)

*Guide list → guide detail → booking form (price = unit × headcount) → upcoming trips with status badges. Android build, UI text in Korean. UI kit–based visuals; demo data. A stray `\n` is visible above the filter chips — a real rendering bug left in the submitted build.*

## 6. Validation the team reported

All of the following are **team-reported, small-sample** results, not independent measurements.

| Evidence | Reported result | How to read it |
|---|---|---|
| Customer interviews | 10 seniors + 7 adult children. Problem recognition 93%, need agreement 88%, willingness to pay 65% | Directional; sample is too small for statistical claims |
| Internal pilot | APK-based pilot with seniors and adult children; Japan and Taiwan local-mate first batch (10 each) | Operational evidence of recruiting, not retention data |
| Competition / pitch | Pitched at a university startup challenge IR day | Context only |
| Financial plan | 2026 monthly milestones, headcount 3 → 6, hosting and R&D cost lines, subscription + commission revenue tiers | A plan with assumptions, not results |

## 7. What this demonstrates (and what it doesn't)

**Demonstrates**
- Scope re-baselining under a hard deadline, with the design retained as the target state
- Reading documents against source code and flagging drift instead of repeating claims
- A requirement traceability matrix (38 requirements → screen → API → entity) and 13 non-functional requirements with verification methods

**Does not demonstrate**
- Hand-written production application code. The client was generated with an AI design-to-code tool and integrated by the team.
- Real payments or real safety operations.

The next step that closes the biggest gap is in [`reference-impl/`](../reference-impl/README.md): the duplicate-booking and duplicate-webhook rules from the design, running as tests against PostgreSQL in CI.
