import { RemovalPolicy } from "aws-cdk-lib";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { AuroraConstruct, AuroraConstructProps } from "../construct/aurora.construct";
import env, { isProd } from "../env";

type ApiAuroraClusterProps = {
  vpc: Vpc;
  securityGroup: SecurityGroup;
};

const environment = env.environment;

export class ApiAuroraCluster extends AuroraConstruct {
  constructor(scope: Construct, props: ApiAuroraClusterProps) {
    const { vpc, securityGroup } = props;
    const name = "api";
    const config: AuroraConstructProps = {
      vpc,
      name,
      securityGroup,
    };

    super(scope, `ApiAuroraCluster-${environment}`, config);

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
      entry: "function/rds-cluster-start.ts",
      environment: {
        IDENTIFIER: this.clusterIdentifier,
      },
      functionName: `${this.clusterIdentifier}-rds-cluster-start`,
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
        minute: "0",
        hour: "10",
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
      entry: "function/rds-cluster-stop.ts",
      environment: {
        IDENTIFIER: this.clusterIdentifier,
      },
      functionName: `${this.clusterIdentifier}-rds-cluster-stop`,
      logRetention: RetentionDays.FIVE_DAYS,
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
        minute: "10",
        hour: "22",
      }),
      targets: [target],
    });
  }
}
