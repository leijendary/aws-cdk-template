import { KeyGroup, KeyGroupProps, PublicKey } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import env from "../../env";

type KeyGroupConstructProps = {
  publicKey: PublicKey;
};

const { environment, organization } = env;

export class KeyGroupConstruct extends KeyGroup {
  constructor(scope: Construct, props: KeyGroupConstructProps) {
    const config: KeyGroupProps = {
      keyGroupName: `${organization}-${environment}`,
      items: [props.publicKey],
    };

    super(scope, `KeyGroup-${environment}`, config);
  }
}
