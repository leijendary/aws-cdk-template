import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import env from "../env";

const { environment, slack } = env;
const { token, channel } = slack;

export class AlarmStack extends Stack {
  constructor(scope: Construct, props: StackProps) {
    super(scope, `Alarm-${environment}`, props);

    this.createNotifier();
  }

  private createNotifier() {
    const lambda = new NodejsFunction(this, `AlarmNotifier-${environment}`, {
      functionName: `alarm-notifier-${environment}`,
      entry: "function/alarm-notifier.ts",
      architecture: Architecture.ARM_64,
      environment: {
        SLACK_TOKEN: token,
        SLACK_CHANNEL: channel,
      },
    });

    new LogGroup(this, `AlarmNotifierLogGroup-${environment}`, {
      logGroupName: `/aws/lambda/${lambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });
  }
}
