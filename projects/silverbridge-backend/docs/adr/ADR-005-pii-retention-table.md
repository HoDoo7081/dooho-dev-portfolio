# ADR-005: Fix the encryption, retention and disposal table per sensitive field at design time

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** SilverBridge

## Context
A service for seniors handles identity, location and payment data. Adding retention and disposal rules afterward means tearing up the schema again.

## Decision
Fix encryption, retention and disposal criteria for each sensitive field in a table. Examples: phone numbers are KMS-encrypted and kept 3 years after withdrawal; location data is anonymized or deleted after 6 months; payment transaction IDs are kept 5 years.

## Consequences
**Gains**
- Personal-data and location-data issues are handled before implementation
- Retention periods become inputs to schema and batch-job design

**Costs and risks**
- Periods may change after legal review, so a separate review is needed before launch
- Disposal batches and anonymization jobs become an added operational responsibility

## Alternatives considered
- **Patch it after implementation:** raises the cost of redesigning the schema → rejected

## Related
[SECURITY.md](../../design-package/04_Security/SECURITY.md) · [OPERATIONS.md](../../design-package/05_Operations/OPERATIONS.md)
