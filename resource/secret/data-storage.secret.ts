import { RemovalPolicy, SecretValue } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env from "../../env";

const environment = env.environment;

export class DataStorageSecret extends Secret {
  constructor(scope: Construct) {
    super(scope, `DataStorageSecret-${environment}`, {
      secretName: `data-storage-${environment}`,
      description: "Credentials for non-AWS created data storage",
      secretObjectValue: {
        "elasticsearch.username": SecretValue.unsafePlainText(""),
        "elasticsearch.password": SecretValue.unsafePlainText(""),
        // Non-AWS postgres database.
        "postgres.username": SecretValue.unsafePlainText(""),
        "postgres.password": SecretValue.unsafePlainText(""),
        "redis.username": SecretValue.unsafePlainText(""),
        "redis.password": SecretValue.unsafePlainText(""),
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
