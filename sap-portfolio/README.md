# SAP portfolio — professional contribution & independent lab

## Evidence status

| Track | Status | What it supports |
|---|---|---|
| J&J SAP ECC–Ariba transition | Professional experience, self-reported | Business-side requirements, validation, UAT, training and change management |
| SAP purchasing / invoice variance lab | Planned — no system execution results | A testable investigation specification only; not implementation experience |
| SAP certifications | Earned | Certified knowledge; not proof of customer module configuration |

## 1. Professional contribution

Read the [J&J transformation case](../enterprise-case-studies/jnj-digital-transformation-enablement.md). The SAP contribution concerned four Korean affiliates and business-side change management. It does not establish ownership of SAP module configuration, ABAP development, or the overall solution architecture. No employer documents, recreated confidential designs, or customer data are included.

## 2. Independent investigation: partial receipts & invoice variance

**Status: design specification. Not yet executed on SAP.** This is a common-process learning scenario, not a claimed customer incident or a reconstruction of J&J's configuration.

### Question

For a purchase order of 100 units, a receipt of 60 units, and a supplier invoice for 100 units, what does the selected SAP environment actually do, and why? Do not assume automatic rejection or payment blocking. Expected behavior must be established against the edition, invoice-verification settings, receipt references, applicable tolerance configuration and user actions.

### Environment acceptance gate

Before beginning, record:

- Product edition, release, tenant/client and relevant activated business scope (exclude credentials).
- Assigned roles, available apps and whether configuration is read-only or editable.
- Training/shared-system restrictions and ownership of permitted test objects.
- Access expiry, reset policy, data retention and a legitimate route to repeat the lab.
- What screenshots, recordings and original artifacts may be published under applicable terms.

If only transaction access is provided, label the work **process testing**, not a configuration project. Never change shared global settings without explicit authorization. No long-term environment has been confirmed for this lab.

### Minimal scope

One company code/plant/purchasing context, one supplier, one material and a controlled set of purchase documents. Use artificial data only. Record price, quantity, unit of measure, tax and currency explicitly; avoid mixing variables in the first comparison. Actual values and object identifiers remain unassigned until the system is inspected.

### Test matrix — planned, all results pending

| ID | Scenario | Investigation / expected-result prerequisite | Result |
|---|---|---|---|
| P01 | PO 100, GR 100, invoice 100 | Establish successful baseline and document linkage | Not run |
| P02 | PO 100, GR 60, invoice 60 | Establish partial-receipt and partial-invoice behavior | Not run |
| P03 | PO 100, GR 60, invoice 100 | Establish applicable receipt/invoice checks before predicting system response | Not run |
| P04 | Fixed quantity, changed invoice price | Read permitted tolerance configuration; define below/at/above-boundary cases | Not run |
| P05 | Remaining receipt of 40 after P03 | Examine follow-up status and authorized resolution steps; do not assume automatic release | Not run |
| P06 | Controlled receipt reversal | Establish prerequisites and trace impact on document history | Not run |

This matrix is a starting specification, not SAP product documentation. Adjust it to supported functionality and document every change before execution.

### Deliverables required before calling the lab complete

1. Requirements and scope, with explicit acceptance criteria.
2. Edition-specific process and configuration rationale, with source references.
3. Artificial test-data manifest and reproducible setup instructions.
4. Test executions linking prerequisites → action → document references → observed result.
5. Defect/root-cause log with expected vs actual behavior, correction and retest.
6. Evidence index and a second-run reproducibility check in a compatible authorized environment.

### Completion gates

- **Process-tested:** baseline and exception have recorded actual outcomes.
- **Configuration-analyzed:** relevant settings and their effect have been traced.
- **Configuration-tested:** authorized setting change and controlled comparison actually performed.
- **Reproduced:** a second run completed from the documented prerequisites.

Do not promote the status based solely on documentation or screenshots. A local simulation is not an SAP execution result. Do not publish exam questions, course exercises, secrets or proprietary material.

## Learning references

- [SAP sourcing & procurement course](https://learning.sap.com/courses/implementing-sap-s-4hana-cloud-public-edition-sourcing-and-procurement)
- [Practice-system policies and setup guidance](https://learning.sap.com/helpcenter/learninghub-subscription/practice-systems)
- [SAP Architecture Center](https://architecture.learning.sap.com/) — design references, not a running ERP environment.

## 한국어 요약

실제 SAP 관련 업무 경험과 개인 실습을 구분합니다. J&J 사례는 업무 측 변경관리·검증·교육 경험이며 모듈 설정 경력이 아닙니다. 구매 실습은 아직 설계 단계입니다. 장기 유지 환경과 설정 권한을 먼저 확보하고, 실제 실행·설정 분석·변경 비교·재현 확인이 끝난 범위만 완료로 표시합니다. GitHub 문서나 웹사이트만으로 SAP 실습 환경의 만료 문제를 해결했다고 주장하지 않습니다.
