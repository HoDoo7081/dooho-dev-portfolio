# ADR-002: 중복 예약은 UNIQUE 제약 + Idempotency-Key로 이중 차단

- **상태**: Accepted (설계 단계 — 구현 전 합의된 결정)
- **프로젝트**: SilverBridge

## Context (배경)
모바일 네트워크에서 재시도가 흔하고, 시니어 대리 이용 등으로 같은 요청이 반복될 수 있습니다. 좌석은 한정되어 있어 중복 예약이 곧 재고 오류입니다.

## Decision (결정)
좌석 재고를 `availability_slots(seats_total, seats_reserved)`로 관리하고, `bookings`에 `UNIQUE(listing_id, slot_id, traveler_id)`를 둡니다. 추가로 `POST /v1/bookings`는 `Idempotency-Key`를 받고, 결제 웹훅은 서명 검증 + 중복 이벤트 키로 처리합니다.

## Consequences (결과)
**얻는 것**
- 같은 사용자의 동일 슬롯 중복 예약을 DB가 차단
- 재시도·웹훅 재전송에서도 중복 예약·결제가 생기지 않음

**감수하는 것 / 리스크**
- 좌석 차감은 별도 동시성 제어가 필요 — 현재 스타터는 트랜잭션 내 잔여 좌석 확인만 하며 `SELECT … FOR UPDATE` 또는 원자적 UPDATE 적용이 다음 단계 (README 한계 참고)
- Idempotency-Key 저장·만료 정책이 추가로 필요

## Alternatives Considered (검토한 대안)
- **애플리케이션 레벨 중복 검사만**: 경쟁 조건에서 뚫림 → 기각
- **Idempotency-Key만 사용**: 서로 다른 키로 같은 예약이 들어오는 경우를 막지 못함 → UNIQUE와 병행

## Related
[SECURITY.md](../../../design-package/04_Security/SECURITY.md) · [bookings.service.ts](../../../api-starter/src/modules/bookings/bookings.service.ts)
