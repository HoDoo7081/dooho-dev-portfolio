# ADR-003: Integer KRW + bps fee; only the server computes amounts

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** Fee Payment Link MVP

## Context
Decimal amounts create rounding error, and trusting an amount sent by the client invites tampering. The fee policy may also change.

## Decision
Store every amount as **integer KRW**, and compute the fee as `platformFee = floor(netAmount × platformFeeRateBps ÷ 10,000)` (default 500 bps) and the charge as `netAmount + platformFee`, **on the server only**. Example: 100,000 KRW → fee 5,000 KRW → charge 105,000 KRW. The payment screen shows the final amount with the service included instead of a "card fee".

## Consequences
**Gains**
- Rounding error is removed at the source, and a policy change is just a change of the bps value
- Not trusting client values blocks amount tampering

**Costs and risks**
- Rounding down (floor) creates sub-1-KRW differences, which must be documented as policy
- Actual PG cost and VAT display need later extension under a separate tax policy (the MVP records `platformFee` as a single value)

## Alternatives considered
- **Storing decimal amounts:** calculation and comparison rules get complicated → rejected
- **Accepting a client-computed value:** tampering risk → rejected

## Related
[01-PRD.md](../../01-PRD.md), amount policy
