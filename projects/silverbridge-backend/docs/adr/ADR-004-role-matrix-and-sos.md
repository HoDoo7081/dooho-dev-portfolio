# ADR-004: Role × endpoint permission matrix, with SOS allowed for every role

- **Status:** Accepted (design stage: agreed before implementation)
- **Project:** SilverBridge

## Context
Travelers, hosts, assistants and admins handle different data, and because children and assistants use the service on a senior's behalf, the risk of permission abuse is high. In an emergency, however, permissions must never block the call.

## Decision
Apply a role × endpoint permission matrix and ownership checks (users only access their own bookings, messages and reviews), with assistant assignment **created by an admin and approved by the assistant**. As an exception, `POST /v1/safety/sos` is **allowed for every role**.

## Consequences
**Gains**
- Least privilege; prevents permission abuse when someone acts on a senior's behalf
- The safety function cannot be blocked by a permission misconfiguration

**Costs and risks**
- Contract tests are needed so the matrix and the guard implementation do not drift apart
- Separate monitoring is needed to catch SOS abuse (false calls)

## Alternatives considered
- **Check only whether the user is logged in:** dangerous in a proxy-use model → rejected
- **Restrict SOS by role too:** risk of blocking access in an emergency → rejected

## Related
[SECURITY.md](../../design-package/04_Security/SECURITY.md)
