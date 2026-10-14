# Doo Ho Ahn — Product & Backend Design Portfolio

**Enterprise SaaS 프로젝트·솔루션 컨설팅 경력** 위에서 직접 기획·설계한 서비스의 산출물 모음입니다.
KAIST PMBA(Data Science 부전공) 재학 중이며, 문제 정의부터 데이터 모델·API 계약·보안·운영·테스트 기준까지 **"만들기 전에 합의해야 할 것들"** 을 문서로 정리하는 데 강점이 있습니다.

> **English summary** — Two end-to-end design packages: (1) *SilverBridge*, an AI-assisted travel companion platform for seniors — PostgreSQL schema (31 tables), OpenAPI 3 contract, security/ops/test strategy and a NestJS starter; (2) *Fee Payment Link*, a card-payment-link MVP for club treasurers — PRD, money/ledger/refund/settlement design with webhook-idempotency principles. Design-first work; implementation status is stated honestly in each README.

📧 dksengh7081@gmail.com

---

## 이 저장소의 의도

코드 양을 보여주기보다, **제품 문제를 시스템 설계로 번역하는 과정**을 보여주려는 저장소입니다.

| 단계 | 어디서 확인할 수 있나 |
|---|---|
| 문제 정의·사용자 분석 | SilverBridge README §1–2, Fee Payment PRD §2–4 |
| 요구사항·정책 | Fee Payment PRD (금액 정책, 상태 모델, 환불·정산 규칙) |
| 데이터 모델링 | SilverBridge `02_SQL/schema.sql` (31개 테이블, 제약조건) |
| API 계약 | SilverBridge `03_API/openapi.yaml` |
| 보안·개인정보 | 권한 매트릭스, 보존·파기·암호화 표 |
| 운영·신뢰성 | SLO, 파티셔닝, 백업/복구, 대사(reconciliation) |
| 테스트 전략 | 계약·성능·보안 테스트, 동시성 시나리오 |
| 한계의 명시 | 각 README 마지막의 "현재 상태와 한계" |

## 프로젝트

### 1. [SilverBridge](projects/silverbridge-backend) — 시니어 부모님 자유여행 AI 동행 플랫폼
- **무엇**: 자유여행이 두려운 시니어를 위한 AI 동행 매칭 + 안전(SOS·위치 공유) 플랫폼의 백엔드 설계
- **산출물**: PostgreSQL 15 스키마(31 테이블) · OpenAPI 3 · 보안/운영/테스트 설계 · 업무 프로세스 모델 · NestJS+Prisma 스타터
- **하이라이트**: DB 제약으로 상태·중복 예약 차단, 매칭 결과의 알고리즘 버전 관리, 역할×엔드포인트 권한 매트릭스, 개인정보 보존·파기표, SLO 숫자 합의
- **성격**: KAIST App 창업 프로그램 팀 프로젝트 (팀 내 CEO·전략 책임, 설계 산출물 직접 작성 · AI는 검수자로 활용)

### 2. [회비 결제 링크 MVP](projects/fee-payment-link-mvp) — 총무를 위한 카드 결제 링크
- **무엇**: 모임 회비를 링크 하나로 받고 환불·정산까지 관리하는 서비스의 제품·백엔드 설계
- **산출물**: PRD · 백엔드 과제서 · 엔지니어링 가이드 · 프론트 핸드오프 · 운영·개인정보 기준
- **하이라이트**: 정수 원화 + bps 수수료 정책, 검증된 웹훅 기반 결제 확정(이벤트 ID 선삽입 멱등), append-only 원장, 환불 상태 머신, 정산 스냅샷, 출시 승인 체크리스트
- **성격**: 개인 제품 기획 (신규 사업 아이디어)

## 읽는 순서

- **3분**: 이 README → 각 프로젝트 README의 "핵심 설계 결정" 표
- **10분**: SilverBridge `SECURITY.md`·`OPERATIONS.md`, Fee Payment `03-ENGINEERING-GUIDE.md`
- **30분**: `schema.sql`, `openapi.yaml`, `01-PRD.md` 전체

## 저장소 원칙

- 비밀값(API 키, 토큰, `.env`), 개인정보, 고객사·지원 회사 관련 자료는 포함하지 않았습니다.
- 수치·정책은 각 문서에 실제로 적힌 값만 인용했고, 구현되지 않은 부분은 README에 "한계"로 적었습니다.
