# 운영/성능/가용성 설계

## 1) SLO (초기)
- API P95 응답시간 ≤ 300ms
- 가용성 99.9%
- 오류율 ≤ 0.1%

## 2) 인덱스/파티셔닝
- 인덱스: bookings(traveler_id), bookings(listing_id,status), messages(thread_id,sent_at), availability_slots(listing_id,start_ts,end_ts), user_locations(user_id,captured_at DESC)
- 파티셔닝 후보:
  - messages: 월 단위 range 파티션
  - audit_logs: 월 단위 range 파티션
  - user_locations: 월 단위 range 파티션

## 3) 확장성
- 읽기 집중: 캐시(예: Redis)로 listings 검색 결과 캐싱
- 비동기 처리: 결제 완료 후 영수증 발송, 보험 연계는 큐(Kafka/SQS) 처리

## 4) 백업/복구
- 일일 전체 백업 + 7일 PITR
- RTO 1h / RPO 15m

## 5) 모니터링/알림
- APM(요청 지연/에러), DB 지표(락/대기), 큐 적체, 웹훅 실패 재시도 경고
- 주요 알림: 결제/예약 실패율 상승, 슬롯 동시성 실패 증가
