# ADR-005: 민감정보별 암호화·보존·파기 표를 설계 단계에서 확정

- **상태**: Accepted (설계 단계 — 구현 전 합의된 결정)
- **프로젝트**: SilverBridge

## Context (배경)
시니어 대상 서비스는 신원·위치·결제 정보를 다루며, 사후에 보존·파기 규칙을 붙이면 스키마를 다시 뜯어야 합니다.

## Decision (결정)
민감정보별로 암호화·보존·파기 기준을 표로 확정합니다. 예: 전화번호는 KMS 암호화 후 탈퇴 3년 보존, 위치정보는 6개월 후 익명화·삭제, 결제 거래 ID는 5년 보존.

## Consequences (결과)
**얻는 것**
- 개인정보·위치정보 이슈를 구현 전에 선제 대응
- 보존 기간이 스키마·배치 설계의 입력값이 됨

**감수하는 것 / 리스크**
- 법무 검토에 따라 기간이 바뀔 수 있음 — 출시 전 별도 검토 필요
- 파기 배치·익명화 작업이 운영 책임으로 추가됨

## Alternatives Considered (검토한 대안)
- **구현 후 보완**: 스키마 재설계 비용 증가 → 기각

## Related
[SECURITY.md](../../design-package/04_Security/SECURITY.md) · [OPERATIONS.md](../../design-package/05_Operations/OPERATIONS.md)
