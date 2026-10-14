# Test strategy

<sub>🌐 English · [한국어 원본](../ko/06_Test/TEST_STRATEGY.md)</sub>

## 1) Unit tests
- Service layer (booking seat validation, payment amount calculation, permission checks), mock-based

## 2) Integration and contract tests
- OpenAPI-schema-based contract tests (frontend / backend)
- Run scenarios on a test DB (Postgres) after applying migrations

## 3) Performance tests
- `/v1/bookings` at 100–300 concurrent RPS; measure error rate and lock wait under slot-seat contention
- RPS spike test on `/v1/payments/sessions`

## 4) Security tests
- JWT forgery, privilege escalation, request floods (rate limiting), webhook signature tampering

## 5) Sample scenarios
- Scenario A: search listings → create booking → create payment session → handle webhook → write review
- Scenario B: contended duplicate booking of the same slot → confirm the "not enough seats" error
