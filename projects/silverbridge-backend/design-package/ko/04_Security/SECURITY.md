# 보안/권한 설계

## 1) 역할별 권한 매트릭스 (요약)

| 엔드포인트 | TRAVELER | HOST | ADMIN | ASSISTANT |
|---|---|---|---|---|
| GET /v1/listings | R | R | R | R |
| POST /v1/bookings | C | - | - | - |
| POST /v1/payments/sessions | C | - | - | - |
| POST /v1/messages/threads | C | C | C | C |
| GET/POST /v1/messages/{threadId} | R/W(본인 포함) | R/W(본인 포함) | R/W | R/W |
| POST /v1/reviews | C(자기 예약에 한함) | - | - | - |
| POST /v1/assistants/assign | - | - | C | C(승인 필요) |
| POST /v1/concierge/sessions | - | - | - | C |
| POST /v1/safety/sos | C | C | C | C |
| GET /v1/admin/audit | - | - | R | - |

- R=Read, C=Create, W=Write/Update, `-`=접근 불가

## 2) 민감정보/보존·파기/암호화

| 테이블.컬럼 | 분류 | 암호화/마스킹 | 보존 기간 | 파기 |
|---|---|---|---|---|
| users.phone | 개인정보 | 저장시 암호화(KMS), 응답마스킹 | 탈퇴 후 3년 | 주기적 물리 삭제 |
| messages.body | 일반(대화) | 저장 | 1년 | 보관기간 경과 일괄 삭제 |
| payments.provider_txn_id | 금융 | 저장시 암호화 | 회계감사 목적 5년 | 파기 로그 |
| user_locations.latitude/longitude | 위치 | 저장 | 6개월 | 익명화/삭제 |
| audit_logs.* | 로그 | 저장 | 1년 | 순환 삭제 |

## 3) 인증/인가
- JWT(Bearer) 기반, 만료 1h/리프레시 14d
- 역할/소유권 체크: 예약/메시지/리뷰 등은 본인 소유 리소스만 접근 가능
- 관리자 기능은 별도 스코프(`role=ADMIN`) 요구

## 4) 입력 검증/레이트 리밋/멱등성
- 전 엔드포인트 DTO 스키마 검증
- `/v1/bookings`는 `Idempotency-Key` 필수 권장
- 결제/웹훅은 서명 검증 및 중복 이벤트 방지 키 관리
