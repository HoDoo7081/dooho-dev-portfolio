import * as cdk from 'aws-cdk-lib';
import { SilverbridgeProofStack } from '../lib/silverbridge-proof-stack';

const app = new cdk.App();
new SilverbridgeProofStack(app, 'SilverbridgeProof', {
  description: 'SilverBridge reference architecture: data plane + test runner (proof deployment)',
  // Region defaults to your CLI configuration. Seoul is the design target: ap-northeast-2.
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
