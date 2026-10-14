# Final package: logical and physical model + backend design

<sub>🌐 English · [한국어 원본](ko/README.md) · [← Project README](../README.md)</sub>

- Target DB: **PostgreSQL 15**
- Modeling tool: **Lucidchart (Mac)**; see `01_ERD/README.md` for the source and validation link
- Contents:
  - `02_SQL/schema.sql`: full DDL (sb.*)
  - `02_SQL/migrations/001_init_sb.sql`: initial migration
  - `02_SQL/seed.sql`: minimal seed data
  - `03_API/openapi.yaml`: full-scope OpenAPI spec (core domain)
  - `04_Security/SECURITY.md`: role permissions, PII, rate limiting, idempotency
  - `05_Operations/OPERATIONS.md`: SLOs, indexes / partitions, backup / recovery, monitoring
  - `06_Test/TEST_STRATEGY.md`: test strategy and scenarios

## How to reproduce
1. Prepare PostgreSQL 15 (local or cloud)
2. Run `02_SQL/schema.sql` with `psql`, then `02_SQL/seed.sql`
3. For an OpenAPI-based backend implementation, refer to `/03_API/openapi.yaml` (the NestJS sample package can be used)
