import { Construct } from "constructs";
import { PublicVpcConstruct, PublicVpcConstructProps } from "../construct/vpc.construct";
import env from "../env";

const environment = env.environment;

export class AppVpc extends PublicVpcConstruct {
  constructor(scope: Construct) {
    const config: PublicVpcConstructProps = {
      name: "app",
    };

    super(scope, `AppVpc-${environment}`, config);
  }
}
