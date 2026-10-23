# Validation evidence

## Existing personal-app UAT (2026-10-22)

The source chat and local UAT report recorded a synthetic customer workflow, using manual JSON import rather than a paid model call:

| Check | Observed result |
|---|---|
| Import | 9 proposals, all initially pending |
| Selective bulk review | 5 facts selected and approved; 4 questions reviewed separately |
| Apply | Project created only after explicit review/apply |
| Notion layout | Actual project template applied; 7 structured documents and version snapshots |
| Questions | 4 linked tasks |
| Re-sync | Existing document/task IDs retained; no normal re-sync duplicates |
| Audit | Per-item prior review state preserved; hash-chain check valid |
| PoC gate | Drafting blocked while 4 questions remained unresolved |

No private workspace URLs, project IDs, tokens, database files or customer records are included in this public evidence summary.

**Excluded from that UAT:** paid AI API calls, extraction-quality evaluation, the complete customer review/completion/reuse lifecycle, and crash-boundary recovery. A test plan is not a passed result. Synthetic scenario figures are not measured customer savings.

## Published source tests

Run `npm test` and `npm run check` from the project directory. The suite exercises approvals, source binding, stale-context rejection, review history, PoC gates, audit integrity, case lifecycle and bulk-review atomicity, plus Notion block construction. These tests require no external accounts and do not prove remote service availability.

The public copy replaces private Notion IDs with environment configuration. Notion synchronization in your environment requires the setup in SETUP.md and separate integration verification.


## Publication check (2026-10-23)

The isolated public copy passed **18/18 automated tests** on Node.js 24.11.1 and `npm run check`. A publication scan found no credential patterns, private workspace IDs, local data files or absolute private paths in the selected source files. The original personal installation and existing portfolio working-tree changes were not modified.
