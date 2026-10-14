# Architecture Decision Records — 회비 결제 링크 MVP

돈이 오가는 서비스에서 **"무엇을 먼저 못 박아야 하는가"** 에 대한 결정 기록입니다. 각 ADR은 README의 핵심 설계 결정을 배경·결과·대안까지 풀어쓴 것입니다.

| ADR | 결정 | 상태 |
|---|---|---|
| [001](../ADR-001-modular-monolith-provider-adapter.md) | 모듈형 모놀리스 + 결제 공급자 어댑터 | Accepted (설계 단계) |
| [002](../ADR-002-verified-webhook-confirmation.md) | 결제 확정은 리디렉션이 아니라 검증된 웹훅으로 | Accepted (설계 단계) |
| [003](../ADR-003-integer-krw-bps-fee.md) | 정수 원화 + bps 수수료, 금액은 서버만 계산 | Accepted (설계 단계) |
| [004](../ADR-004-append-only-ledger.md) | 추가 전용(append-only) 원장 | Accepted (설계 단계) |
| [005](../ADR-005-refund-state-machine.md) | 환불은 상태 머신 + 멱등키, 타임아웃은 대사로 확정 | Accepted (설계 단계) |
| [006](../ADR-006-settlement-snapshot.md) | 정산은 스냅샷으로 고정하고, 정산 후 환불은 차단 | Accepted (설계 단계) |

> 형식: Context → Decision → Consequences → Alternatives ([ADR 표준 형식](https://docs.gitscrum.com/en/best-practices/technical-decision-records) 기준). 구현 전 설계 단계의 결정이며, 구현 중 바뀌면 상태를 갱신합니다.

[← 프로젝트 README로](../../../README.ko.md)
