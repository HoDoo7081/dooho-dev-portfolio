# Operations, refund, settlement and privacy guide

<sub>🌐 English · [한국어 원본](ko/02-OPERATIONS-AND-PRIVACY.md) · [← Project README](README.md)</sub>

## 1. Operating principle

The lack of automation in a managed MVP is intentional. By having an operator review every new group and every high-risk action, we learn which group types can be approved, how often refunds happen, which fraudulent-payment patterns appear, and what real treasurers need.

## 2. Application review checklist

- Treasurer's phone identity check
- Account holder matches the settlement account
- Relationship between the group and the applicant
- Reasonableness of dues purpose and amount
- Expected headcount and total transaction value
- Clarity of the refund policy
- Possibility of self-charging cards repeatedly or cash-out schemes
- Links between the same contact, account or device and earlier risky applications

New groups get a payment limit and a settlement grace period.

## 3. Draft operating SLA

- Application receipt confirmation: automatic, immediate
- First review: target within 1 business day
- Request for additional documents: notify via a status page and text message
- Link issuance: during business hours after approval
- Simple refund before settlement: target within 1 business day
- Member list request: generated during business hours
- Settlement: on the agreed cycle after internal checks are complete

Finalize these to match real operating capacity before publishing externally.

## 4. Refund rules

- The default is a full cancellation to the original payment method.
- Show in each campaign's refund policy who can request a refund, the payer or the treasurer.
- A refund before settlement is processed after checking the order and the person's identity.
- A payment that is being settled or has been settled is not auto-refunded.
- On a payment-provider timeout, do not cancel twice; look the status up again.
- Change the internal ledger and the member list only after confirming the card cancellation succeeded.
- Record operator, time and reason for every manual decision.

## 5. Settlement rules

```text
Settlement target = sum of the treasurer's receivable on PAID payments
                    − the treasurer's receivable on REFUNDED payments
                    − amount already included in earlier settlements
                    − amount held for disputes and refunds
```

- When a settlement is created, freeze the included payments as a snapshot.
- An account change goes through re-verification of the existing contact and additional review.
- A payout record keeps the transfer date, amount, bank transaction identifier and processing operator.
- For a refund after settlement, put a treasurer-return or offset-against-next-settlement rule in the contract.

## 6. Minimal personal-data collection

### Treasurer

- Name, mobile number, identity-check result
- Group information
- Settlement account and account holder
- Application, consent and consultation history

### Payer

- Name
- One identifier the group needs
- Contact
- Payment and refund records

Address, date of birth, gender and card data are not collected by default.

## 7. Access and delivery

- Give a treasurer only the member list of campaigns they applied for.
- Mask list contact details by default.
- Design original-data lookup and download so operator permissions can be separated.
- Download links must be unguessable and expire.
- Log download creation, access and reissue.
- Avoid plaintext email attachments and sending files directly through messengers.

## 8. Retention and disposal

- State the retention period for each purpose of collection in the privacy policy.
- Destroy personal data whose purpose has ended and that has no legal retention basis.
- Keep transaction records retained by law separate from service personal data.
- Set expiry policies not only for the operating DB but also for backups, export files and logs.
- Exact statutory retention periods and wording on overseas transfer and processing delegation are finalized by an expert before launch.

## 9. Lovable usage rules

- Put only fictional data into Lovable.
- Do not paste real application or payment personal data into prompts.
- Do not put real API keys or the Shopify Admin token into the frontend.
- The customer-facing frontend calls only public APIs.
- Admin functions and original personal data are handled in a separate backend and admin environment.
