# Operations, performance and availability design

<sub>🌐 English · [한국어 원본](../ko/05_Operations/OPERATIONS.md)</sub>

## 1) SLOs (initial)
- API P95 response time ≤ 300 ms
- Availability 99.9%
- Error rate ≤ 0.1%

## 2) Indexes and partitioning
- Indexes: bookings(traveler_id), bookings(listing_id, status), messages(thread_id, sent_at), availability_slots(listing_id, start_ts, end_ts), user_locations(user_id, captured_at DESC)
- Partitioning candidates:
  - messages: monthly range partitions
  - audit_logs: monthly range partitions
  - user_locations: monthly range partitions

## 3) Scalability
- Read-heavy: cache listing-search results (e.g. Redis)
- Asynchronous work: receipt delivery and insurance sync after payment completion go through a queue (Kafka / SQS)

## 4) Backup and recovery
- Daily full backup + 7-day PITR
- RTO 1 h / RPO 15 min

## 5) Monitoring and alerts
- APM (request latency / errors), DB metrics (locks / waits), queue backlog, warnings on webhook-failure retries
- Key alerts: rising payment / booking failure rate, rising slot-concurrency failures
