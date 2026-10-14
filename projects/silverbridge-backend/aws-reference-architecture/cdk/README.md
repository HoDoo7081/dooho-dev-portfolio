# Proof deployment (AWS CDK)

<sub>[← AWS reference architecture](../README.md) · [Reference implementation](../../reference-impl/README.md)</sub>

A TypeScript CDK stack that deploys the **network, data and async layers** of the [reference architecture](../README.md) and runs the 13 reference-implementation tests against **Amazon RDS** from a one-off Fargate task. Goal: turn "designed for AWS" into "ran on AWS" in one afternoon, for a few dollars, then delete it.

> [!IMPORTANT]
> **Status, stated plainly.** The stack is validated in CI (`cdk synth`, and the test-runner image is built and run against PostgreSQL). **I have not deployed it to a live AWS account yet.** Do not read this page as evidence of a running deployment until the "Result" section below is filled with a real run.

## What it creates

| Layer | Resources |
|---|---|
| Network | VPC across 2 AZs; public, private-with-egress and **isolated data** subnets; **one** NAT gateway; S3 gateway endpoint |
| Data | RDS PostgreSQL 15 (`t4g.micro`, encrypted, isolated subnets, not public); credentials generated in Secrets Manager; security group allows 5432 **only** from the runner |
| Async | SQS queue with a dead-letter queue (TLS enforced); S3 media bucket (encrypted, public access blocked) |
| Compute | ECS cluster and a Fargate task definition for the test runner (image built from this repo; RDS CA bundle baked in; connects with `verify-full` TLS) |
| Observability | SNS topic and three alarms: DLQ not empty, RDS CPU above 80%, connection count high |

Not created: CloudFront, WAF, ALB and the API service. The NestJS starter is still a skeleton, so there is nothing honest to put behind a load balancer yet.

## Deploy, test, delete

Prerequisites: an AWS account and CLI credentials, Node 20, Docker (CDK builds the image), and `cdk bootstrap` run once per account and region.

```bash
cd projects/silverbridge-backend/aws-reference-architecture/cdk
npm install
npx cdk bootstrap            # once per account/region
npx cdk deploy               # about 10-15 minutes, mostly RDS
./scripts/run-tests.sh       # starts the Fargate task; exit code 0 = all 13 tests passed
npx cdk destroy              # DELETE IT: stops all charges
```

Design target flags: `-c multiAz=true` (Multi-AZ database) and `-c production=true` (deletion protection, 7-day backups, data retained on destroy). The defaults favour low cost and easy teardown.

## Cost of the proof (estimate)

The NAT gateway and the database dominate. Rough list-price assumptions: NAT about 1 USD per day, `t4g.micro` RDS plus 20 GB storage about 0.5 to 1 USD per day, everything else negligible for a short run. **A 4-hour session costs on the order of 1 USD; leaving it running costs about 40 to 60 USD per month.** Check the AWS Pricing Calculator for your region, and set a budget alert before deploying.

## Safety notes

- The runner runs `DROP SCHEMA sb CASCADE` on its database. It points at a database this stack creates, never at an existing one.
- The stack tags everything `purpose=portfolio-proof-delete-after-use`.
- Credentials never appear in the template or the repo; the task reads them from Secrets Manager at start.

## Result (fill in after a real run)

| Item | Value |
|---|---|
| Date and region | _not yet run_ |
| Tests passed | _not yet run_ |
| Task log excerpt / screenshot | _not yet run_ |
| Total cost | _not yet run_ |
