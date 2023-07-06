import { Construct } from "constructs";
import env from "../env";
import { PublicVpcConstruct } from "./../construct/vpc.construct";

const environment = env.environment;
const { cidrBlock } = env.config;

export class AppVpc extends PublicVpcConstruct {
  constructor(scope: Construct) {
    const vpcName = `app-vpc-${environment}`;

    super(scope, `AppVpc-${environment}`, {
      vpcName,
      cidrBlock,
    });
  }
}
