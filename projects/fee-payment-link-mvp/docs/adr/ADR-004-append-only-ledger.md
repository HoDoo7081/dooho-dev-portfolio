# ADR-004: 추가 전용(append-only) 원장

- **상태**: Accepted (설계 단계 — 구현 전 합의된 결정)
- **프로젝트**: 회비 결제 링크 MVP

## Context (배경)
현재 잔액만 저장하면 "왜 이 금액인가"를 추적할 수 없고, 환불·정산·정정이 겹칠 때 분쟁 해결이 어렵습니다.

## Decision (결정)
금액 사건을 모두 원장에 **추가만** 합니다: `PAYMENT_CAPTURED`, `PLATFORM_FEE_RECOGNIZED`, `REFUND_RESERVED`, `REFUND_COMPLETED`, `SETTLEMENT_RESERVED`, `SETTLEMENT_PAID`, `CHARGEBACK_RECORDED`, `MANUAL_ADJUSTMENT`. 수정·삭제 없이 반대 항목으로 정정하고, 수동 조정에는 운영자·사유·관련 거래를 필수로 남깁니다.

## Consequences (결과)
**얻는 것**
- 모든 금액 변경이 추적 가능, 공급자 기록과의 대사가 쉬움
- 결제 후 상품 가격이 바뀌어도 기존 주문 원장은 불변

**감수하는 것 / 리스크**
- 잔액 조회는 집계가 필요 (필요 시 스냅샷·뷰로 보완)
- 정정 시 항목이 늘어남

## Alternatives Considered (검토한 대안)
- **잔액 컬럼 갱신(UPDATE)**: 이력이 사라져 분쟁·감사에 취약 → 기각
- **이벤트 소싱 전면 도입**: MVP에는 과함 → 원장 테이블에 한정

## Related
[ADR-002](ADR-002-verified-webhook-confirmation.md) · [ADR-005](ADR-005-refund-state-machine.md)
