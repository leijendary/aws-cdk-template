import { KeyGroup, PublicKey } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import env from "../../env";

type KeyGroupConstructProps = {
  publicKey: PublicKey;
};

const environment = env.environment;
const organization = env.organization;

export class KeyGroupConstruct extends KeyGroup {
  constructor(scope: Construct, props: KeyGroupConstructProps) {
    super(scope, `KeyGroup-${environment}`, {
      keyGroupName: organization,
      items: [props.publicKey],
    });
  }
}
