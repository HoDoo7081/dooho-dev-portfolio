# 백엔드 엔지니어링 가이드

## 1. 권장 아키텍처

초기에는 마이크로서비스가 아닌 모듈형 모놀리스를 권장한다.

```text
API
 ├─ Auth
 ├─ Organization
 ├─ Campaign
 ├─ Checkout
 ├─ Payment
 ├─ Refund
 ├─ Settlement
 ├─ Ledger
 └─ Admin
       ↓
Application Services
       ↓
Domain + Repository Interfaces
       ↓
PostgreSQL / Shopify Adapter / Mock Provider
```

결제 공급자를 도메인에서 분리하면 MVP 이후 Shopify를 국내 PG 직접 연동으로 교체할 수 있다.

## 2. Shopify 매핑

| 내부 개념 | Shopify 개념 | 비고 |
|---|---|---|
| 회비 캠페인 | Product | 배송 불필요 상품 |
| 회비 가격 | Product Variant | KRW 단일 가격 |
| 납부 시도 | Cart/Checkout | 내부 payment ID를 attribute로 전달 |
| 납부 완료 | Order + paid transaction | 웹훅으로 확정 |
| 전액 환불 | Refund 또는 Order cancel | 원 결제수단 환불 |
| 부분 환불 | Refund | MVP UI 범위 밖 |

권장 메타데이터:

```text
organization_id
campaign_id
payment_id
net_amount
platform_fee
schema_version
```

상품명에는 개인정보를 포함하지 않는다. 회원 이름이나 전화번호는 상품명, URL, Shopify 태그에 넣지 않는다.

## 3. Shopify 생성 흐름

```text
캠페인 DRAFT 생성
→ 내부 금액 확정
→ Provider.createProduct()
→ providerProductId/providerVariantId 저장
→ 캠페인 ACTIVE 전환
→ 공개 링크 활성화
```

외부 상품 생성은 DB 트랜잭션 안에서 장시간 기다리지 않는다. 권장 방식은 다음과 같다.

1. 내부 캠페인을 `DRAFT`로 저장한다.
2. 외부 상품 생성 작업을 수행한다.
3. 성공하면 공급자 ID를 기록하고 `ACTIVE`로 전환한다.
4. 실패하면 `DRAFT`를 유지하고 재시도 가능하게 한다.

## 4. 결제 확정 원칙

- 브라우저의 성공 URL은 사용자 안내용이다.
- 결제 확정은 웹훅 서명 검증 후 처리한다.
- 공급자 주문 ID와 거래 ID에 유일 인덱스를 둔다.
- 웹훅 이벤트 ID를 먼저 삽입하고 중복이면 성공 응답 후 종료한다.
- 이벤트 처리와 원장 반영은 하나의 DB 트랜잭션으로 묶는다.

의사코드:

```text
verify signature
begin transaction
  insert provider_event(event_id) on conflict do nothing
  if duplicate: commit and return 200
  lock payment row
  validate amount/currency/campaign
  transition payment to PAID
  append ledger entries
  mark provider_event processed
commit
```

## 5. 원장 설계

현재 잔액만 저장하지 말고 금액 사건을 추가형 원장으로 기록한다.

예시 원장 유형:

- `PAYMENT_CAPTURED`
- `PLATFORM_FEE_RECOGNIZED`
- `REFUND_RESERVED`
- `REFUND_COMPLETED`
- `SETTLEMENT_RESERVED`
- `SETTLEMENT_PAID`
- `CHARGEBACK_RECORDED`
- `MANUAL_ADJUSTMENT`

원장 항목은 삭제·수정하지 않고 반대 항목을 추가한다. 수동 조정은 운영자, 사유, 관련 거래를 필수로 기록한다.

## 6. 환불 설계

외부 API 호출과 DB 저장을 하나의 원자적 트랜잭션으로 만들 수 없으므로 상태 머신과 멱등키가 필요하다.

```text
PAID
→ REFUND_PENDING
→ 외부 환불 호출
→ 성공 확인
→ REFUNDED + 원장 반영
```

타임아웃 시 `FAILED`로 즉시 되돌리지 않는다. 공급자 환불 ID 조회 또는 대사 작업을 통해 최종 상태를 확인한다.

2026-04 이후 Shopify GraphQL `refundCreate`는 멱등성 지시자가 필수이므로 사용 API 버전과 요구사항을 고정한다. 구현 당시 최신 Shopify 공식 문서를 재확인한다.

## 7. 정산 설계

정산 가능액을 단순 캐시 값으로만 관리하지 않는다.

```text
정산가능액 = 결제 확정 순액
            - 환불 완료/예약 순액
            - 기존 정산 요청에 예약된 순액
            - 운영상 유보액
```

정산 생성 시:

- 대상 payment 행을 잠근다.
- 이미 다른 정산에 포함됐는지 확인한다.
- settlement와 settlement_items를 함께 저장한다.
- 원장에 `SETTLEMENT_RESERVED`를 추가한다.
- 계산 결과와 항목 합계가 일치하지 않으면 전체 롤백한다.

## 8. API 규칙

- 금액: 정수 KRW
- ID: UUID
- 날짜: ISO 8601 UTC
- 목록: cursor 또는 page 기반 중 하나로 일관되게 사용
- 오류 응답: `code`, `message`, `requestId`, `details`
- 쓰기 요청: `Idempotency-Key` 지원
- 추적: 모든 응답에 `X-Request-Id`

클라이언트가 보내도 무시하거나 거절해야 하는 값:

- 플랫폼 수수료
- 최종 결제금액
- 결제 성공 상태
- 정산 가능액
- 환불 완료 상태

## 9. 보안

- 카드번호, CVC, 카드 비밀번호를 서버에서 받거나 저장하지 않는다.
- Shopify Admin 토큰과 웹훅 시크릿은 Secret Manager 또는 환경변수로 관리한다.
- 웹훅 검증에는 파싱 전 raw request body를 사용한다.
- 로그에서 이름, 전화번호, 계좌번호, 토큰을 마스킹한다.
- 공개 링크 ID는 순차 번호가 아닌 추측 불가능한 토큰을 사용한다.
- 운영자 수동 상태 변경은 감사 로그를 남긴다.
- 환불, 정산, 공급자 재동기화 API에는 역할 검사를 적용한다.

## 10. 장애 및 대사

최소 하루 한 번 다음 불일치를 찾는 대사 작업을 고려한다.

- Shopify는 결제 완료지만 내부는 `PENDING`
- Shopify는 환불 완료지만 내부는 `REFUND_PENDING`
- 내부 결제금액과 Shopify 주문금액 불일치
- 공급자 주문 ID가 없는 활성 캠페인
- 정산 항목 합계와 정산 요청 금액 불일치

MVP 과제에서는 실제 스케줄러 대신 관리자용 `reconcile` 서비스와 테스트로 표현해도 된다.

## 11. 환경 구분

```text
local: MockPaymentProvider
test: MockPaymentProvider + 고정 시계
staging: Shopify development store
production: 승인된 Shopify store + 국내 PG
```

개발·스테이징·운영은 Shopify 스토어와 웹훅 시크릿을 분리한다.

## 12. 배포 전 확인표

- DB 백업·복구 연습
- 웹훅 재전송 도구
- 중복 이벤트 테스트
- Shopify API rate limit 처리
- 환불 타임아웃 복구
- 금액 및 통화 검증
- 개인정보 마스킹
- 관리자 권한 검사
- 정산 후 환불 정책 적용
- 상품/주문/내부 원장 대사
- 운영 비밀키 미노출

