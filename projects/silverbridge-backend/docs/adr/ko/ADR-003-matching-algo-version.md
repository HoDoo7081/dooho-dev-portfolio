# ADR-003: 매칭 결과에 algo_version을 남긴다

- **상태**: Accepted (설계 단계 — 구현 전 합의된 결정)
- **프로젝트**: SilverBridge

## Context (배경)
매칭 알고리즘은 개선을 반복하며, 개선 효과를 비교하려면 이전 결과가 남아 있어야 합니다. 재계산 시 중복 결과도 막아야 합니다.

## Decision (결정)
`match_candidates`에 `algo_version`을 두고 `UNIQUE(traveler_id, listing_id, algo_version)`를 적용합니다.

## Consequences (결과)
**얻는 것**
- 알고리즘 버전 간 결과 비교(A/B, 롤백) 가능
- 같은 버전의 재계산 시 중복 방지

**감수하는 것 / 리스크**
- 버전별 결과가 쌓여 저장 공간 증가 — 보존 정책 필요

## Alternatives Considered (검토한 대안)
- **최신 결과만 덮어쓰기**: 비교·롤백 불가 → 기각

## Related
[schema.sql](../../../design-package/02_SQL/schema.sql)
