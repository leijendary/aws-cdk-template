import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import {
  AuroraPostgresEngineVersion,
  ClusterInstance,
  Credentials,
  DBClusterStorageType,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseClusterProps,
} from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env from "../env";

export type AuroraConstructProps = {
  vpc: Vpc;
  name: string;
  securityGroup: SecurityGroup;
};

const { account, region, environment, isProd } = env;

export class AuroraConstruct extends DatabaseCluster {
  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    const { vpc, name, securityGroup } = props;
    const config: DatabaseClusterProps = {
      clusterIdentifier: `${name}-${environment}`,
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_17_2,
      }),
      serverlessV2MaxCapacity: isProd ? 4 : 1,
      writer: ClusterInstance.serverlessV2("WriterInstance"),
      readers: [],
      storageType: DBClusterStorageType.AURORA,
      credentials: createCredentials(scope, name),
      backup: {
        retention: Duration.days(isProd ? 30 : 1),
        preferredWindow: "21:30-22:00",
      },
      storageEncrypted: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_ISOLATED,
      }),
      securityGroups: [securityGroup],
      preferredMaintenanceWindow: "Tue:22:00-Tue:22:30",
    };

    if (isProd) {
      config.readers!.push(ClusterInstance.serverlessV2("ReaderInstance"));
    }

    super(scope, id, config);

    if (!isProd) {
      this.createStartSchedule(name);
      this.createStopSchedule(name);
    }
  }

  private createStartSchedule(name: string) {
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["rds:StartDBCluster"],
      resources: [`arn:aws:rds:${region}:${account}:cluster:${this.clusterIdentifier}`],
    });
    const lambda = new NodejsFunction(this, `RdsClusterStartFunction-${name}-${environment}`, {
      functionName: `${this.clusterIdentifier}-rds-cluster-start`,
      entry: "function/rds-cluster-start.ts",
      architecture: Architecture.ARM_64,
      environment: {
        IDENTIFIER: this.clusterIdentifier,
      },
    });
    lambda.addToRolePolicy(policyStatement);

    new LogGroup(this, `RdsClusterStartFunctionLogGroup-${name}-${environment}`, {
      logGroupName: `/aws/lambda/${lambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });
    new Rule(this, `RdsClusterStartFunctionScheduler-${name}-${environment}`, {
      ruleName: `${this.clusterIdentifier}-rds-cluster-start-scheduler`,
      schedule: Schedule.cron({
        minute: "55",
        hour: "09",
      }),
      targets: [new LambdaFunction(lambda)],
    });
  }

  private createStopSchedule(name: string) {
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["rds:StopDBCluster"],
      resources: [`arn:aws:rds:${region}:${account}:cluster:${this.clusterIdentifier}`],
    });
    const lambda = new NodejsFunction(this, `RdsClusterStopFunction-${name}-${environment}`, {
      functionName: `${this.clusterIdentifier}-rds-cluster-stop`,
      entry: "function/rds-cluster-stop.ts",
      architecture: Architecture.ARM_64,
      environment: {
        IDENTIFIER: this.clusterIdentifier,
      },
    });
    lambda.addToRolePolicy(policyStatement);

    new LogGroup(this, `RdsClusterStopFunctionLogGroup-${name}-${environment}`, {
      logGroupName: `/aws/lambda/${lambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });
    new Rule(this, `RdsClusterStopFunctionScheduler-${name}-${environment}`, {
      ruleName: `${this.clusterIdentifier}-rds-cluster-stop-scheduler`,
      schedule: Schedule.cron({
        minute: "0",
        hour: "22",
      }),
      targets: [new LambdaFunction(lambda)],
    });
  }
}

function createCredentials(scope: Construct, name: string) {
  const secret = Secret.fromSecretNameV2(scope, `AuroraSecret-${name}-${environment}`, `${environment}/aurora/${name}`);

  return Credentials.fromSecret(secret);
}
