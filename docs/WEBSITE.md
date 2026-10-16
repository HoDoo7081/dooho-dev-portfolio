# Engineering & Delivery Casebook

## Purpose

`doohoahn.com` introduces the person and career. This GitHub Pages site is the evidence-led casebook: business problem → data/design decision → implementation → verification → limitations. It is not another online résumé.

## Source and publication

- `index.html`: selected-work landing page, professional summaries and concise credentials.
- `portfolio.css`: responsive navy / lime / paper editorial system.
- `portfolio.js`: bilingual content and hash-routed case studies; no build dependency.
- GitHub Pages: `main`, `/docs`.
- Preview from `docs`: `python3 -m http.server 8765 --bind 127.0.0.1`.

The former `website/index.html` local draft is not the deployed source. Edit `docs/` for this version.

## Design decisions

1. Feature a bounded technical proof, not generic career metrics.
2. Link claims to original schema, code, tests and recorded results.
3. Separate implementation, design artifacts and self-reported employment experience.
4. Distinguish 31-table design from 33-table hardened proof; reference architecture from actually deployed AWS resources; Stage 3 Supabase KV MVP from both.
5. Keep incomplete SAP lab plans off the selected-work landing page. Do not invent ABAP or module-configuration work.
6. Preserve omitted Clarivate employment dates; do not change LinkedIn.

## Editorial reference

[Prime Career: ERP/SAP ABAP portfolio and interview preparation](https://prime-career.com/interview_article/10387) informed the problem/data/implementation/validation/reflection sequence and emphasis on personal contribution. It targets entry-level ABAP applicants, so ABAP-specific examples are not presented as this portfolio owner's experience. Article copy and illustrative projects are not reused as personal evidence.

## Evidence limits

- Test screenshots are historical records, not live test execution.
- The AWS proof stack was destroyed. It is not an operating application.
- The fee-payment acceptance scenarios and launch program are plans, not passed product tests or launch outcomes.
- Client code and proprietary employer/customer material remain private.
- SAP certifications do not establish SAP module implementation experience.

## Verification

Check both languages, every case link, chapter navigation and browser back; verify imagery loads and layouts at desktop and mobile widths. Original evidence images open separately for readability. Code syntax can be checked using `node --check portfolio.js`.
