import * as path from 'path';
import { Duration, RemovalPolicy, Stack, StackProps, CfnOutput, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cw from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';

/**
 * Proof deployment of the SilverBridge reference architecture.
 *
 * Deploys the NETWORK, DATA and ASYNC layers, plus a one-off Fargate task that runs the
 * reference-implementation tests against RDS. It does NOT deploy the public edge
 * (CloudFront, WAF, ALB) or the NestJS API service; the starter is still a skeleton.
 *
 * Context flags (cdk.json or -c):
 *   multiAz=true       Multi-AZ RDS (design target; roughly doubles the DB cost)
 *   production=true    deletion protection, 7-day backups, retain data on destroy
 */
export class SilverbridgeProofStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const multiAz = this.node.tryGetContext('multiAz') === true || this.node.tryGetContext('multiAz') === 'true';
    const production = this.node.tryGetContext('production') === true || this.node.tryGetContext('production') === 'true';
    const removal = production ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    // ---- Network: public / private-with-egress / isolated (data), 2 AZs, ONE NAT (cost) ----
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'app', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'data', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
      gatewayEndpoints: { S3: { service: ec2.GatewayVpcEndpointAwsService.S3 } },
    });

    // ---- Data: RDS PostgreSQL 15 in isolated subnets, encrypted, credentials in Secrets Manager ----
    const dbSg = new ec2.SecurityGroup(this, 'DbSg', { vpc, description: 'RDS: only the app tier may connect', allowAllOutbound: false });
    const runnerSg = new ec2.SecurityGroup(this, 'RunnerSg', { vpc, description: 'Test-runner task' });
    dbSg.addIngressRule(runnerSg, ec2.Port.tcp(5432), 'Postgres from test runner');

    const db = new rds.DatabaseInstance(this, 'Db', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      multiAz,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      databaseName: 'silverbridge',
      credentials: rds.Credentials.fromGeneratedSecret('sbadmin'),
      backupRetention: production ? Duration.days(7) : Duration.days(1),
      deletionProtection: production,
      removalPolicy: removal,
      publiclyAccessible: false,
      enablePerformanceInsights: false,
    });
    const secret = db.secret!;

    // ---- Async: SQS with a dead-letter queue; S3 for media (encrypted, never public) ----
    const dlq = new sqs.Queue(this, 'EventsDlq', { retentionPeriod: Duration.days(14), enforceSSL: true });
    new sqs.Queue(this, 'Events', {
      visibilityTimeout: Duration.seconds(60),
      deadLetterQueue: { queue: dlq, maxReceiveCount: 5 },
      enforceSSL: true,
    });
    new s3.Bucket(this, 'Media', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: production,
      removalPolicy: removal,
      autoDeleteObjects: !production,
    });

    // ---- Compute: one-off Fargate task that loads the schema and runs the 13 tests against RDS ----
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });
    const taskDef = new ecs.FargateTaskDefinition(this, 'TestRunnerTask', {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: { cpuArchitecture: ecs.CpuArchitecture.X86_64, operatingSystemFamily: ecs.OperatingSystemFamily.LINUX },
    });
    // Image built from projects/silverbridge-backend (needs design-package/02_SQL and reference-impl/).
    const image = new ecr_assets.DockerImageAsset(this, 'RunnerImage', {
      directory: path.join(__dirname, '..', '..', '..'),
      file: 'reference-impl/Dockerfile',
      platform: ecr_assets.Platform.LINUX_AMD64,
      exclude: [
        'docs', 'api-starter', 'process-models', 'aws-reference-architecture', 'README*.md',
        '**/node_modules', '**/.git', 'design-package/0[1456]_*', 'design-package/*.md',
      ],
    });
    taskDef.addContainer('runner', {
      image: ecs.ContainerImage.fromDockerImageAsset(image),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'tests', logRetention: logs.RetentionDays.ONE_WEEK }),
      environment: {
        // RDS PostgreSQL 15 enforces TLS; the image carries the RDS CA bundle.
        PGSSLMODE: 'verify-full',
        PGSSLROOTCERT: '/certs/rds.pem',
        NODE_EXTRA_CA_CERTS: '/certs/rds.pem',
      },
      secrets: {
        PGHOST: ecs.Secret.fromSecretsManager(secret, 'host'),
        PGPORT: ecs.Secret.fromSecretsManager(secret, 'port'),
        PGUSER: ecs.Secret.fromSecretsManager(secret, 'username'),
        PGPASSWORD: ecs.Secret.fromSecretsManager(secret, 'password'),
        PGDATABASE: ecs.Secret.fromSecretsManager(secret, 'dbname'),
      },
    });

    // ---- Observability: the alarms the operations design calls for ----
    const alarmTopic = new sns.Topic(this, 'AlarmTopic');
    const alarmAction = new cwActions.SnsAction(alarmTopic);
    const dlqAlarm = new cw.Alarm(this, 'DlqNotEmpty', {
      metric: dlq.metricApproximateNumberOfMessagesVisible({ period: Duration.minutes(1) }),
      threshold: 1, evaluationPeriods: 1, comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'A message exhausted its retries: investigate, do not ignore',
    });
    dlqAlarm.addAlarmAction(alarmAction);
    const cpuAlarm = new cw.Alarm(this, 'DbCpuHigh', {
      metric: db.metricCPUUtilization({ period: Duration.minutes(5) }),
      threshold: 80, evaluationPeriods: 3,
      alarmDescription: 'RDS CPU above 80% for 15 minutes',
    });
    cpuAlarm.addAlarmAction(alarmAction);
    const connAlarm = new cw.Alarm(this, 'DbConnectionsHigh', {
      metric: db.metricDatabaseConnections({ period: Duration.minutes(5) }),
      threshold: 60, evaluationPeriods: 2,
      alarmDescription: 'Connection count near the instance limit: consider RDS Proxy',
    });
    connAlarm.addAlarmAction(alarmAction);

    Tags.of(this).add('project', 'silverbridge-proof');
    Tags.of(this).add('purpose', 'portfolio-proof-delete-after-use');

    // ---- Outputs used by scripts/run-tests.sh ----
    new CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
    new CfnOutput(this, 'TaskDefinitionArn', { value: taskDef.taskDefinitionArn });
    new CfnOutput(this, 'PrivateSubnetIds', { value: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds.join(',') });
    new CfnOutput(this, 'RunnerSecurityGroupId', { value: runnerSg.securityGroupId });
    new CfnOutput(this, 'LogGroupHint', { value: 'CloudWatch Logs: /ecs tests prefix (see the task definition)' });
  }
}
