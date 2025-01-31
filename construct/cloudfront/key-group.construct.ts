import env from "@/env";
import { KeyGroup, KeyGroupProps, PublicKey } from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";

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
