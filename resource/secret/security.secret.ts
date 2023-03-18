import { RemovalPolicy, SecretValue } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env from "../../env";

const environment = env.environment;

export class SecuritySecret extends Secret {
  constructor(scope: Construct) {
    super(scope, `SecuritySecret-${environment}`, {
      secretName: `security-${environment}`,
      description: "Security related credentials like crypto, encryption, etc.",
      secretObjectValue: {
        "accessToken.privateKey": SecretValue.unsafePlainText(""),
        "accessToken.publicKey": SecretValue.unsafePlainText(""),
        "refreshToken.privateKey": SecretValue.unsafePlainText(""),
        "refreshToken.publicKey": SecretValue.unsafePlainText(""),
        "encrypt.key": SecretValue.unsafePlainText(""),
        "encrypt.salt": SecretValue.unsafePlainText(""),
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
