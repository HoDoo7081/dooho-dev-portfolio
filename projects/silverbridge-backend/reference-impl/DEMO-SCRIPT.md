# 2-minute demo script (screen recording)

Goal: show, on a real database, that the design's rules hold. Record the terminal full-screen at a large font; no slides.

**Setup (off camera):** `npm install && npm run db:setup`

| Time | Say | Show |
|---|---|---|
| 0:00 | "SilverBridge is a travel-booking design for seniors. The claim in my design is that duplicate bookings, overbooking and duplicate payment webhooks cannot happen. Here is the proof." | Repo page, [`schema.sql`](../design-package/02_SQL/schema.sql) → `bookings` `UNIQUE(listing_id, slot_id, traveler_id)` |
| 0:20 | "First, 10 people race for the last 3 seats." | `npm run demo` step 1 → `3 confirmed, 7 sold out` |
| 0:40 | "The same traveler books the same slot again. The database blocks it." | step 2 |
| 0:55 | "Payment providers redeliver webhooks. I send the same one 8 times in parallel." | step 3 → `processed once, 7 duplicates ignored` |
| 1:15 | "Refunds are a state machine. After a refund, I try to force the payment back to PAID with raw SQL." | step 4 → `database refused` |
| 1:30 | "Tests prove it, and I checked the tests can fail: remove a protection, the matching test goes red." | `npm test` → 13 pass; open README mutation table |
| 1:50 | "Honest scope: this is a reference implementation, not the shipped app. The shipped Stage 3 app ran on Supabase, and I list exactly what it did not do." | [STAGE3-MVP.md](../docs/STAGE3-MVP.md) gap table |

Keep it under 2:00. Upload as unlisted and link it at the top of the project README.
