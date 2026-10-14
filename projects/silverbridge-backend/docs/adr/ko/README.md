# Architecture Decision Records — SilverBridge

시니어 여행 플랫폼 백엔드 설계에서 **"DB와 계약으로 규칙을 강제한"** 결정들의 기록입니다. README의 핵심 설계 결정 표를 배경·결과·대안까지 풀어썼습니다.

| ADR | 결정 | 상태 |
|---|---|---|
| [001](../ADR-001-db-enforced-states.md) | 상태 값은 DB CHECK 제약으로 강제 | Accepted (설계 단계) |
| [002](../ADR-002-duplicate-booking-and-idempotency.md) | 중복 예약은 UNIQUE 제약 + Idempotency-Key로 이중 차단 | Accepted (설계 단계) |
| [003](../ADR-003-matching-algo-version.md) | 매칭 결과에 algo_version을 남긴다 | Accepted (설계 단계) |
| [004](../ADR-004-role-matrix-and-sos.md) | 역할×엔드포인트 권한 매트릭스, 단 SOS는 모든 역할 허용 | Accepted (설계 단계) |
| [005](../ADR-005-pii-retention-table.md) | 민감정보별 암호화·보존·파기 표를 설계 단계에서 확정 | Accepted (설계 단계) |

> 형식: Context → Decision → Consequences → Alternatives ([ADR 표준 형식](https://docs.gitscrum.com/en/best-practices/technical-decision-records) 기준). 구현 전 설계 단계의 결정이며, 구현 중 바뀌면 상태를 갱신합니다.

[← 프로젝트 README로](../../../README.ko.md)
