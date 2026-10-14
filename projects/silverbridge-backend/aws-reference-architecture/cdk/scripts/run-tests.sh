#!/usr/bin/env bash
# Runs the one-off test task on Fargate and prints its result. Requires: aws CLI v2, a deployed SilverbridgeProof stack.
set -euo pipefail
STACK=${STACK:-SilverbridgeProof}
out() { aws cloudformation describe-stacks --stack-name "$STACK" --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }
CLUSTER=$(out ClusterName); TASKDEF=$(out TaskDefinitionArn); SUBNETS=$(out PrivateSubnetIds); SG=$(out RunnerSecurityGroupId)

TASK=$(aws ecs run-task --cluster "$CLUSTER" --task-definition "$TASKDEF" --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=DISABLED}" \
  --query 'tasks[0].taskArn' --output text)
echo "started $TASK; waiting for it to stop..."
aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$TASK"
CODE=$(aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK" --query 'tasks[0].containers[0].exitCode' --output text)
echo "container exit code: $CODE  (0 = all 13 tests passed)"
echo "logs: CloudWatch Logs, log stream prefix 'tests/runner/' for task ${TASK##*/}"
exit "$CODE"
