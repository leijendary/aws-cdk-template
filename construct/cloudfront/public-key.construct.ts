import { CfnOutput } from "aws-cdk-lib";
import { PublicKey } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";
import env from "../../env";

const environment = env.environment;

export class PublicKeyConstruct extends PublicKey {
  constructor(scope: Construct) {
    const keyPath = join(__dirname, `../../security/distribution-key.${environment}.pem`);
    const encodedKey = readFileSync(keyPath, {
      encoding: "utf-8",
    });

    super(scope, `PublicKey-${environment}`, {
      encodedKey,
    });

    this.output();
  }

  private output() {
    new CfnOutput(this, `PublicKeyId-${environment}`, {
      value: this.publicKeyId,
    });
  }
}
