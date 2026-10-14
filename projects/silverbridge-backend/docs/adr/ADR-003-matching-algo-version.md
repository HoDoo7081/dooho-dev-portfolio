# ADR-003: Keep `algo_version` on every matching result

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** SilverBridge

## Context
The matching algorithm will be improved repeatedly, and comparing improvements requires keeping earlier results. Duplicate results on recompute must also be prevented.

## Decision
Add `algo_version` to `match_candidates` and apply `UNIQUE(traveler_id, listing_id, algo_version)`.

## Consequences
**Gains**
- Results can be compared across algorithm versions (A/B, rollback)
- No duplicates when the same version is recomputed

**Costs and risks**
- Results accumulate per version and storage grows, so a retention policy is needed

## Alternatives considered
- **Overwrite with the latest result only:** no comparison or rollback → rejected

## Related
[schema.sql](../../design-package/02_SQL/schema.sql)
