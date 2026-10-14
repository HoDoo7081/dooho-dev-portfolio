# 산출물#7 / #8 최종 패키지 (논리·물리 모델 + 백엔드 설계)

- 목표 DB: **PostgreSQL 15**
- 모델링 도구: **Lucidchart (Mac)** – 원본/검증 링크는 `01_ERD/README.md` 참고
- 포함물:
  - `02_SQL/schema.sql` : 전체 DDL (sb.*)
  - `02_SQL/migrations/001_init_sb.sql` : 초기 마이그레이션
  - `02_SQL/seed.sql` : 최소 시드 데이터
  - `03_API/openapi.yaml` : 전범위 OpenAPI 스펙(핵심 도메인)
  - `04_Security/SECURITY.md` : 역할권한·PII·레이트리밋·멱등성
  - `05_Operations/OPERATIONS.md` : SLO·인덱스/파티션·백업/복구·모니터링
  - `06_Test/TEST_STRATEGY.md` : 테스트 전략 및 시나리오

## 재현 가이드
1. PostgreSQL 15 준비 (로컬/클라우드)
2. `psql`로 `02_SQL/schema.sql` 실행 → `02_SQL/seed.sql` 실행
3. OpenAPI 기반 백엔드 구현은 `/03_API/openapi.yaml` 참조 (NestJS 예시 패키지 사용 가능)
