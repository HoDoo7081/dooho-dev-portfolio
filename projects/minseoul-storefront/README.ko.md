# Min Seoul — 헤드리스 K-뷰티 스토어프론트 (고객사 프로젝트, 운영 중)

<sub>[English](README.md) · **한국어**<br>[← 포트폴리오 홈](../../README.ko.md)</sub>

**[minseoul.com](https://minseoul.com)** 은 한국 스킨케어 브랜드를 대만 등 아시아 고객에게 판매하는 **실제 운영 중인** 크로스보더 이커머스 사이트입니다. 고객사 프로젝트라 소스코드는 공개하지 않고, 구조·제 역할·개선점만 정리했습니다. 자세한 내용은 영어 원문을 참고해 주세요.

| 항목 | 내용 |
|---|---|
| 스택 | React 19 · TanStack Start · Cloudflare Workers · Shopify Storefront/Admin API · Supabase(Postgres, Auth, RLS) |
| 기능 | 4개 언어(EN·繁中·简中·TH)·5개 통화 표시, 대만 통관 ID 수집 단계, 인플루언서 할인 링크 클릭 추적 대시보드, 계정·주문조회 |
| 제 역할 | 고객사 Figma를 Lovable(AI 앱 빌더)로 구현하는 과정의 통합·납품 리드, Shopify 연동, 결제 연동(Toss, PayPal, Airwallex, Payoneer), 인플루언서 영업, 유지보수. 직접 타이핑한 코드라고 주장하지 않습니다. |
| 정직한 한계 | 결제사 설정·인플루언서 계약·성분 에디터는 코드 스냅샷에 없습니다. 매출·전환율은 고객사 자료라 공개하지 않습니다. |
| 스스로 찾은 개선점 | 대만 통관 ID 평문 저장(P1), IP 보관기간 미정(P1), 공개 insert 정책 스팸 위험(P2), 토큰·도메인 하드코딩 및 CORS `*`(P2), 환율 상수(P3), 클릭만 측정(P3) |
