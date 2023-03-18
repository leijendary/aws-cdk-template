import { Stack, StackProps } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env from "../env";
import { DataStorageSecret } from "../resource/secret/data-storage.secret";
import { SecuritySecret } from "../resource/secret/security.secret";
import { IntegrationSecret } from "./../resource/secret/integration.secret";

const environment = env.environment;

export class SecretStack extends Stack {
  dataStorageSecret: Secret;
  integrationSecret: Secret;
  securitySecret: Secret;

  constructor(scope: Construct, props: StackProps) {
    const id = `SecretStack-${environment}`;

    super(scope, id, props);

    this.createDataStorageSecret();
    this.createIntegrationSecret();
    this.createSecuritySecret();
  }

  private createDataStorageSecret() {
    this.dataStorageSecret = new DataStorageSecret(this);
  }

  private createIntegrationSecret() {
    this.integrationSecret = new IntegrationSecret(this);
  }

  private createSecuritySecret() {
    this.securitySecret = new SecuritySecret(this);
  }
}
