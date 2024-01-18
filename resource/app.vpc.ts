import { Construct } from "constructs";
import env from "../env";
import { PublicVpcConstruct, PublicVpcConstructProps } from "./../construct/vpc.construct";

const { environment, config } = env;
const { cidrBlock } = config;

export class AppVpc extends PublicVpcConstruct {
  constructor(scope: Construct) {
    const vpcName = `app-${environment}`;
    const config: PublicVpcConstructProps = {
      vpcName,
      cidrBlock,
    };

    super(scope, `AppVpc-${environment}`, config);
  }
}
