import { CfnOutput } from "aws-cdk-lib";
import { PublicKey, PublicKeyProps } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";
import env from "../../env";

const environment = env.environment;

export class PublicKeyConstruct extends PublicKey {
  constructor(scope: Construct) {
    const config: PublicKeyProps = {
      encodedKey: readFileSync(join(__dirname, `../../security/distribution-key.${environment}.pem`), {
        encoding: "utf-8",
      }),
    };

    super(scope, `PublicKey-${environment}`, config);

    this.output();
  }

  private output() {
    new CfnOutput(this, `PublicKeyID-${environment}`, {
      value: this.publicKeyId,
    });
  }
}
