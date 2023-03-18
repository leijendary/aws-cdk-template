import { Construct } from "constructs";
import env from "../env";
import { PublicVpcConstruct } from "./../construct/vpc.construct";

type AppVpcProps = {
  cidrBlock: string;
};

const environment = env.environment;

export class AppVpc extends PublicVpcConstruct {
  constructor(scope: Construct, props: AppVpcProps) {
    const { cidrBlock } = props;
    const vpcName = `app-vpc-${environment}`;

    super(scope, `AppVpc-${environment}`, {
      vpcName,
      cidrBlock,
    });
  }
}
