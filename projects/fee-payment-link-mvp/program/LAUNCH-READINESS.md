# Go / no-go and RACI — Fee Payment Link

<sub>[← Launch program](README.md)</sub>

## Go / no-go: the 7 launch-approval conditions

Source: [Definition of Launch](../README.md#7-definition-of-launch). A condition is **met** only when the evidence artifact exists; "done" in conversation does not count.

| # | Condition | Evidence required | Blocking? | Status |
|---|---|---|:-:|---|
| 1 | Shopify test payment and full card cancellation succeed | Recorded test run + provider dashboard screenshot | Yes | Not started |
| 2 | Partial cancellation: possible or not, policy decided | Provider test result + ADR note | No (policy can be "not supported") | Not started |
| 3 | Duplicate-webhook test passes | CI test output (pattern demonstrated in [SilverBridge reference-impl](../../silverbridge-backend/reference-impl/README.md)) | Yes | Pattern proven elsewhere; not built here |
| 4 | Price change after payment leaves the existing ledger unchanged | Automated test | Yes | Not started |
| 5 | Refund after settlement is blocked | Automated test | Yes | Not started |
| 6 | PG and Shopify fee tables confirmed | Signed-off table in repo | Yes | Open (issue I1) |
| 7 | Operator reconciliation screen or CSV available | Sample CSV with zero unexplained rows | Yes | Not started |

**Decision rule.** Go = every blocking condition met, no open P1 risk in the RAID log, closed-beta defects triaged with no money-correctness bug open. Otherwise no-go, with a dated recheck.

## RACI

R = does the work · A = accountable (one per row) · C = consulted · I = informed

| Activity | PM | Backend | Frontend | Operator | Legal / Finance |
|---|:-:|:-:|:-:|:-:|:-:|
| Provider and policy decisions | A/R | C | I | C | C |
| Checkout, webhook, ledger | C | A/R | I | I | I |
| Refund and settlement logic | C | A/R | I | C | C |
| Payment page and payer list | C | C | A/R | I | I |
| Reconciliation CSV / screen | A | R | I | R | I |
| Terms, privacy, refund policy | A | I | I | C | R |
| Closed beta | A/R | C | C | R | I |
| Go / no-go decision | A/R | C | C | C | C |

## Communication

| What | Who | When |
|---|---|---|
| Risk review (RAID) | PM + leads | Weekly, 30 min |
| Milestone gate review | PM + owner of the milestone | At each M-exit |
| Beta status note | Beta clubs, operator | Weekly during M6 |
| Go / no-go memo | All | M7 |
