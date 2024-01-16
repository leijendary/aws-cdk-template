import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
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
      actions: ["rds:DescribeDBClusters", "rds:StartDBCluster"],
      resources: [`arn:aws:rds:${this.stack.region}:${this.stack.account}:cluster:${this.identifier}`],
    });
    const lambda = new NodejsFunction(this, `RdsClusterStartFunction-${this.identifier}`, {
      architecture: Architecture.ARM_64,
      entry: "function/rds-cluster-start.ts",
      environment: {
        IDENTIFIER: this.identifier,
      },
      functionName: `${this.stack.stackName}-${name}-rds-cluster-start`,
      logRetention: RetentionDays.FIVE_DAYS,
    });
    lambda.addToRolePolicy(policyStatement);

    const target = new LambdaFunction(lambda);

    new Rule(this, `RdsClusterStartFunctionScheduler-${this.identifier}`, {
      ruleName: `${this.stack.stackName}-${name}-rds-cluster-start-scheduler`,
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
      actions: ["rds:DescribeDBClusters", "rds:StopDBCluster"],
      resources: [`arn:aws:rds:${this.stack.region}:${this.stack.account}:cluster:${this.identifier}`],
    });
    const lambda = new NodejsFunction(this, `RdsClusterStopFunction-${this.identifier}`, {
      architecture: Architecture.ARM_64,
      entry: "function/rds-cluster-stop.ts",
      environment: {
        IDENTIFIER: this.identifier,
      },
      functionName: `${this.stack.stackName}-${name}-rds-cluster-stop`,
      logRetention: RetentionDays.FIVE_DAYS,
    });
    lambda.addToRolePolicy(policyStatement);

    const target = new LambdaFunction(lambda);

    new Rule(this, `RdsClusterStopFunctionScheduler-${this.identifier}`, {
      ruleName: `${this.stack.stackName}-${name}-rds-cluster-stop-scheduler`,
      schedule: Schedule.cron({
        minute: "10",
        hour: "22",
      }),
      targets: [target],
    });
  }
}
