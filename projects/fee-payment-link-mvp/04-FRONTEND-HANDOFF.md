# 프론트엔드 병렬 개발 가이드

## 1. 개발 원칙

프론트엔드는 백엔드 완성을 기다리지 않고 `openapi.yaml`을 기준으로 개발한다. 화면 내부에서 수수료나 정산 가능액을 확정 계산하지 않고 서버 응답을 표시한다.

프론트에서 미리 계산한 5% 금액은 입력 보조용으로만 사용할 수 있으며, 회비 생성 응답의 `amounts`를 최종값으로 사용한다.

## 2. 권장 화면

### 총무 영역

| 화면 | 경로 예시 | 주요 API |
|---|---|---|
| 로그인 | `/login` | 과제에서는 demo token |
| 모임 목록 | `/dashboard` | `GET /v1/organizations` |
| 모임 생성 | `/organizations/new` | `POST /v1/organizations` |
| 모임 상세 | `/organizations/:id` | `GET /v1/organizations/:id`, campaigns |
| 회비 생성 | `/organizations/:id/campaigns/new` | `POST /v1/organizations/:id/campaigns` |
| 회비 관리 | `/campaigns/:id` | `GET /v1/campaigns/:id`, payments |
| 환불 확인 | `/payments/:id/refund` | `POST /v1/payments/:id/refunds` |
| 정산 요청 | `/organizations/:id/settlements/new` | summary, settlements 목록·생성 |

### 회원 영역

| 화면 | 경로 예시 | 주요 API |
|---|---|---|
| 공개 회비 페이지 | `/pay/:slug` | `GET /v1/public/campaigns/:slug` |
| 납부자 정보 | `/pay/:slug/payer` | 로컬 폼 |
| 결제 이동 | `/pay/:slug/checkout` | `POST /v1/public/campaigns/:slug/checkouts` |
| 결제 결과 | `/pay/result` | `GET /v1/public/payments/:publicToken` |

## 3. 핵심 컴포넌트

- `Money`: KRW 천 단위 표기, 입력값과 표시값 분리
- `CampaignStatusBadge`
- `PaymentStatusBadge`
- `SettlementStatusBadge`
- `FeeBreakdown`: 목표 정산액, 이용료, 최종 결제액
- `PaymentTable`: 검색, 상태 필터, 페이지네이션
- `RefundDialog`: 환불 가능 여부와 경고 표시
- `SettlementSummary`: 가능액, 요청 중, 지급 완료
- `AsyncState`: loading, empty, error, retry

## 4. 회비 생성 폼

필드:

- 모임 ID
- 회비명
- 설명
- 총무 목표 정산액
- 납부기한
- 최대 납부 인원
- 납부자에게 받을 추가 식별정보 라벨, 예: 학번
- 환불정책 안내

금액 입력 예시:

```text
총무가 받을 금액     100,000원
플랫폼 이용료          5,000원
회원 최종 결제금액    105,000원
```

문구에서 `카드 수수료` 대신 `플랫폼 이용료`를 사용한다.

## 5. 결제 결과 처리

Shopify 성공 리디렉션 직후에도 내부 상태는 잠시 `PENDING`일 수 있다.

권장 UX:

```text
결제를 확인하고 있습니다.
→ 2초 간격으로 최대 5회 상태 조회
→ PAID이면 완료 화면
→ 계속 PENDING이면 "결제 확인 중"과 나중에 확인할 링크 제공
```

프론트가 성공 URL만 보고 `PAID`로 표시해서는 안 된다.

## 6. 환불 UX

상태별 버튼:

- `PAID` + 정산 미포함: 환불 요청 활성화
- `REFUND_PENDING`: 버튼 비활성화, 처리 중 표시
- `REFUNDED`: 환불 완료일 표시
- 정산 포함: 자동 환불 버튼 대신 고객지원 안내

환불 요청에는 매번 새로운 `Idempotency-Key`를 생성한다. 네트워크 재시도에는 동일한 키를 재사용한다.

## 7. Mock 데이터 예시

### 캠페인

```json
{
  "id": "8a224e83-1d43-4e46-9d53-f4d98e24c920",
  "organizationId": "bd6f3e48-a465-4401-b471-c32b593346f8",
  "name": "2026년 2학기 회비",
  "description": "사진동아리 운영 및 전시 준비 비용",
  "slug": "photo-club-2026-fall-x7k2",
  "status": "ACTIVE",
  "amounts": {
    "netAmount": 100000,
    "platformFeeRateBps": 500,
    "platformFee": 5000,
    "chargeAmount": 105000,
    "currency": "KRW"
  },
  "dueAt": "2026-09-30T14:59:59Z",
  "capacity": 30,
  "paidCount": 12
}
```

### 납부 목록 항목

```json
{
  "id": "6d87a317-edc4-4d51-af39-9534d38fd9b2",
  "payerName": "홍길동",
  "payerIdentifier": "20261234",
  "status": "PAID",
  "chargeAmount": 105000,
  "netAmount": 100000,
  "paidAt": "2026-07-20T05:20:11Z",
  "refundEligibility": "ELIGIBLE"
}
```

### 오류

```json
{
  "code": "CAMPAIGN_CAPACITY_EXCEEDED",
  "message": "납부 가능 인원이 마감되었습니다.",
  "requestId": "req_01J2ABCDXYZ",
  "details": {}
}
```

## 8. 반드시 처리할 오류 코드

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CAMPAIGN_NOT_ACTIVE`
- `CAMPAIGN_EXPIRED`
- `CAMPAIGN_CAPACITY_EXCEEDED`
- `PAYMENT_NOT_REFUNDABLE`
- `PAYMENT_ALREADY_REFUNDED`
- `SETTLEMENT_LOCKED`
- `IDEMPOTENCY_CONFLICT`
- `PAYMENT_PROVIDER_UNAVAILABLE`

## 9. 접근성과 모바일 기준

- 360px 폭에서 결제 핵심정보가 잘리지 않아야 한다.
- 금액은 색상만으로 구분하지 않는다.
- 상태 배지에 텍스트를 포함한다.
- 입력 오류는 필드 옆과 상단 요약에 표시한다.
- 결제 이동 버튼은 중복 클릭을 방지한다.
- 외부 결제 화면으로 이동한다는 안내를 제공한다.

## 10. 프론트 완료 기준

- Mock API로 전체 총무 흐름 실행 가능
- 공개 링크에서 결제 이동까지 실행 가능
- 모든 상태값에 대한 화면 확인 가능
- 로딩·빈 목록·서버 오류·재시도 상태 존재
- 서버 금액과 로컬 미리보기 불일치 시 서버 값을 사용
- 모바일 화면 검증
- API base URL과 demo token이 환경변수로 분리됨
