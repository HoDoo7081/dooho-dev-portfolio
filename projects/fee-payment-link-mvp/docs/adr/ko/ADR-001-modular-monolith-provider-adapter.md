# ADR-001: 모듈형 모놀리스 + 결제 공급자 어댑터

- **상태**: Accepted (설계 단계 — 구현 전 합의된 결정)
- **프로젝트**: 회비 결제 링크 MVP

## Context (배경)
MVP 팀 규모는 작고, 출시 속도가 중요합니다. 동시에 결제 공급자는 MVP에서 Shopify를 쓰지만 이후 국내 PG 직접 연동으로 바뀔 가능성이 큽니다.

## Decision (결정)
서비스를 마이크로서비스로 쪼개지 않고 **하나의 배포 단위(모듈형 모놀리스)** 로 만들고, 모듈은 Auth · Organization · Campaign · Checkout · Payment · Refund · Settlement · Ledger · Admin으로 나눕니다. 결제 공급자는 도메인 밖의 **어댑터**(Shopify / Mock / 향후 PG)로 격리하고, 모임·회원·회비·수수료·정산 장부는 자체 백엔드가 소유합니다.

## Consequences (결과)
**얻는 것**
- 배포·운영 단순, 트랜잭션 경계가 하나라 원장 정합성 보장이 쉬움
- 공급자 교체 시 어댑터만 바꾸면 되고, Mock으로 테스트 가능

**감수하는 것 / 리스크**
- 모듈 경계를 코드 규율로 지켜야 함 (의존 방향 위반 시 모놀리스가 뭉침)
- 트래픽이 커지면 모듈 단위 분리가 필요 — 경계를 처음부터 나눠두는 것으로 대비

## Alternatives Considered (검토한 대안)
- **마이크로서비스**: 초기 팀 규모 대비 운영 부담이 크고, 결제·원장을 분산 트랜잭션으로 다뤄야 함 → 기각
- **Shopify에 장부까지 위임**: 모임·정산 규칙을 표현할 수 없고 공급자 종속 → 기각

## Related
[ADR-002](../ADR-002-verified-webhook-confirmation.md) · [03-ENGINEERING-GUIDE.md](../../../03-ENGINEERING-GUIDE.md)
