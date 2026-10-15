# PoC success framework

[Playbooks](README.md) · Sample template

## Charter

- **Hypothesis:** For [user/workflow], [solution] can achieve [observable result] under [constraints].
- **Decision supported:** What investment or implementation decision will this PoC inform?
- **Scope:** One prioritized use case, supported workflows and explicit exclusions.
- **Owners:** Customer sponsor, technical owner, data owner and delivery owner.
- **Time box:** Start, checkpoint, final review and decision date.

## Acceptance matrix

Agree thresholds before execution; do not invent improvement percentages without a measured baseline.

| Dimension | Test | Acceptance criterion to agree | Evidence |
|---|---|---|---|
| Functional | Representative end-to-end scenario and exception | Required steps and expected outcomes | Script and observed results |
| Integration | Authentication, payload, failure and retry behavior | Contract and failure-handling expectations | Sanitized requests/logs |
| Data | Completeness, quality and access | Required dataset and permitted usage | Data readiness review |
| Security | Roles, sensitive fields and auditability | Customer-approved controls | Access/control checklist |
| Reliability | Duplicate events, outages and recovery | Agreed recovery and consistency behavior | Failure scenario results |
| AI, if relevant | Representative examples and adverse cases | Agreed accuracy/safety rubric and human escalation | Evaluation results and reviewed failures |
| Business relevance | User completes target workflow | Sponsor-approved usability and value criteria | User feedback and baseline comparison |

## Execution record

Capture environment, dataset/version, test date, expected/actual behavior, limitations and owner for each issue. Separate measured findings from estimates and future implementation work.

## Exit decision

- **Proceed:** Agreed criteria met; production work, cost assumptions and owners documented.
- **Revise:** Specific gaps have a bounded remediation plan and another review date.
- **Stop:** Evidence fails the hypothesis or dependencies make the use case impractical.

A passed PoC supports a feasibility decision. Production approval still requires operational ownership, security review, support, rollout and acceptance planning.
