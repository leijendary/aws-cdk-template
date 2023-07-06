import { OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import env from "../../env";

const environment = env.environment;

export class OriginAccessIdentityConstruct extends OriginAccessIdentity {
  constructor(scope: Construct) {
    super(scope, `OriginAccessIdentity-${environment}`);
  }
}
