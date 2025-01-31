import env from "@/env";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

type AlarmStackProps = StackProps;

const { environment, slack } = env;

export class AlarmStack extends Stack {
  constructor(scope: Construct, props: AlarmStackProps) {
    const id = `AlarmStack-${environment}`;

    super(scope, id, props);

    this.createNotifier();
  }

  private createNotifier() {
    const lambda = new NodejsFunction(this, `AlarmNotifier-${environment}`, {
      functionName: `alarm-notifier-${environment}`,
      entry: "function/alarm-notifier.ts",
      environment: {
        SLACK_TOKEN: slack.token,
        SLACK_CHANNEL: slack.channel,
      },
    });

    new LogGroup(this, `AlarmNotifierLogGroup-${environment}`, {
      logGroupName: `/aws/lambda/${lambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });
  }
}
