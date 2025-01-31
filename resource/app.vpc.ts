import { PublicVpcConstruct, PublicVpcConstructProps } from "@/construct/vpc.construct";
import env from "@/env";
import { Construct } from "constructs";

const { environment } = env;

export class AppVpc extends PublicVpcConstruct {
  constructor(scope: Construct) {
    const config: PublicVpcConstructProps = {
      name: "app",
    };

    super(scope, `AppVpc-${environment}`, config);
  }
}
