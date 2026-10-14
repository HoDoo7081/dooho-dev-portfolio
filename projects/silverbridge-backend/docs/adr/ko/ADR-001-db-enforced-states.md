# ADR-001: 상태 값은 DB CHECK 제약으로 강제

- **상태**: Accepted (설계 단계 — 구현 전 합의된 결정)
- **프로젝트**: SilverBridge

## Context (배경)
예약·결제 상태는 코드 여러 곳에서 바뀝니다. 애플리케이션 버그나 직접 쿼리로 잘못된 상태 값이 저장되면 이후 로직 전체가 오염됩니다.

## Decision (결정)
상태 컬럼에 `CHECK` 제약을 둡니다. 예약은 `PENDING/CONFIRMED/CANCELLED/COMPLETED/DISPUTED`, 결제는 `INITIATED/PAID/FAILED/REFUNDED/PARTIAL_REFUNDED`만 허용합니다.

## Consequences (결과)
**얻는 것**
- 어떤 경로로 쓰더라도 정의되지 않은 상태가 저장되지 않음
- 상태 목록이 스키마에 문서화되어 API·테스트와 대조 가능

**감수하는 것 / 리스크**
- 상태 추가 시 마이그레이션이 필요
- 허용되는 *전이 순서*까지는 CHECK로 강제하지 못함 (서비스 계층 규칙으로 보완)

## Alternatives (대안)
공식적으로 비교하지는 않았습니다. 처음부터 **"규칙은 애플리케이션 코드만이 아니라 DB에서 강제한다"** 는 설계 원칙으로 정했습니다. 참고로 흔한 두 선택지와 CHECK가 맞는 이유는 사후에 정리한 것입니다(당시 평가한 것은 아님).
- **애플리케이션 enum만 사용**: DB 직접 접근·버그에 무방비
- **PostgreSQL ENUM 타입**: 값 변경·삭제가 번거로움 → CHECK가 변경에 유리

## Related
[schema.sql](../../../design-package/02_SQL/schema.sql)
