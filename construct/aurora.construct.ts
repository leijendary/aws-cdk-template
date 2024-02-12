import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
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
  IClusterInstance,
} from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env, { isProd } from "../env";

export type AuroraConstructProps = {
  vpc: Vpc;
  name: string;
  securityGroup: SecurityGroup;
};

const environment = env.environment;

export class AuroraConstruct extends DatabaseCluster {
  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    const { vpc, name, securityGroup } = props;
    let readers: IClusterInstance[] = [];

    if (isProd) {
      const reader = ClusterInstance.serverlessV2("reader");
      readers.push(reader);
    }

    const credentials = createCredentials(scope, name);
    const config: DatabaseClusterProps = {
      clusterIdentifier: `${name}-${environment}`,
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_15_5,
      }),
      serverlessV2MinCapacity: isProd ? 1 : 0.5,
      serverlessV2MaxCapacity: isProd ? 16 : 1,
      writer: ClusterInstance.serverlessV2("writer"),
      readers,
      storageType: isProd ? DBClusterStorageType.AURORA_IOPT1 : DBClusterStorageType.AURORA,
      credentials,
      backup: {
        retention: Duration.days(isProd ? 30 : 7),
      },
      storageEncrypted: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [securityGroup],
      preferredMaintenanceWindow: "Tue:22:00-Wed:22:30",
    };

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
      resources: [`arn:aws:rds:${this.stack.region}:${this.stack.account}:cluster:${this.clusterIdentifier}`],
    });
    const lambda = new NodejsFunction(this, `RdsClusterStartFunction-${name}-${environment}`, {
      functionName: `${this.clusterIdentifier}-rds-cluster-start`,
      entry: "function/rds-cluster-start.ts",
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

    const target = new LambdaFunction(lambda);

    new Rule(this, `RdsClusterStartFunctionScheduler-${name}-${environment}`, {
      ruleName: `${this.clusterIdentifier}-rds-cluster-start-scheduler`,
      schedule: Schedule.cron({
        minute: "55",
        hour: "09",
      }),
      targets: [target],
    });
  }

  private createStopSchedule(name: string) {
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["rds:StopDBCluster"],
      resources: [`arn:aws:rds:${this.stack.region}:${this.stack.account}:cluster:${this.clusterIdentifier}`],
    });
    const lambda = new NodejsFunction(this, `RdsClusterStopFunction-${name}-${environment}`, {
      functionName: `${this.clusterIdentifier}-rds-cluster-stop`,
      entry: "function/rds-cluster-stop.ts",
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

    const target = new LambdaFunction(lambda);

    new Rule(this, `RdsClusterStopFunctionScheduler-${name}-${environment}`, {
      ruleName: `${this.clusterIdentifier}-rds-cluster-stop-scheduler`,
      schedule: Schedule.cron({
        minute: "0",
        hour: "22",
      }),
      targets: [target],
    });
  }
}

function createCredentials(scope: Construct, name: string) {
  const secret = Secret.fromSecretNameV2(scope, `AuroraSecret-${name}-${environment}`, `${name}-aurora-${environment}`);

  return Credentials.fromSecret(secret);
}
