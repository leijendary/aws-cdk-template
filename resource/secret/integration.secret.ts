import { RemovalPolicy, SecretValue } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env from "../../env";

const environment = env.environment;

export class IntegrationSecret extends Secret {
  constructor(scope: Construct) {
    super(scope, `IntegrationSecret-${environment}`, {
      secretName: `integration-${environment}`,
      description: "Credentials for third party integrations",
      secretObjectValue: {
        "apple.clientId": SecretValue.unsafePlainText(""),
        "facebook.clientId": SecretValue.unsafePlainText(""),
        "google.clientId": SecretValue.unsafePlainText(""),
        "kafka.username": SecretValue.unsafePlainText(""),
        "kafka.password": SecretValue.unsafePlainText(""),
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
