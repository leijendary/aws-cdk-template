import { PublicSecurityGroup, PublicSecurityGroupProps } from "@/construct/security-group.construct";
import env from "@/env";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

type ApiAlbSecurityGroupProps = {
  vpc: Vpc;
};

const environment = env.environment;

export class ApiLoadBalancerSecurityGroup extends PublicSecurityGroup {
  constructor(scope: Construct, props: ApiAlbSecurityGroupProps) {
    const { vpc } = props;
    const config: PublicSecurityGroupProps = {
      vpc,
      name: "api-loadbalancer",
    };

    super(scope, `ApiLoadBalancerSecurityGroup-${environment}`, config);
  }
}
