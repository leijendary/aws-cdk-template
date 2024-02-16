import { Construct } from "constructs";
import env from "../env";
import { PublicVpcConstruct, PublicVpcConstructProps } from "./../construct/vpc.construct";

const { environment } = env;

export class AppVpc extends PublicVpcConstruct {
  constructor(scope: Construct) {
    const config: PublicVpcConstructProps = {
      name: "app",
    };

    super(scope, `AppVpc-${environment}`, config);
  }
}
