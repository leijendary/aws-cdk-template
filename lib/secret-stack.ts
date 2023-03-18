import { Stack, StackProps } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env from "../env";
import { DataStorageSecret } from "../resource/secret/data-storage.secret";
import { IntegrationSecret } from "./../resource/secret/integration.secret";

const environment = env.environment;

export class SecretStack extends Stack {
  dataStorageSecret: Secret;
  integrationSecret: Secret;

  constructor(scope: Construct, props: StackProps) {
    const id = `SecretStack-${environment}`;

    super(scope, id, props);

    this.createDataStorageSecret();
    this.createIntegrationSecret();
  }

  private createDataStorageSecret() {
    this.dataStorageSecret = new DataStorageSecret(this);
  }

  private createIntegrationSecret() {
    this.integrationSecret = new IntegrationSecret(this);
  }
}
