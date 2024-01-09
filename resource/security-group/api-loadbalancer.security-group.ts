import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { PublicSecurityGroup, PublicSecurityGroupProps } from "../../construct/security-group.construct";
import env from "../../env";

type ApiAlbSecurityGroupProps = {
  vpc: Vpc;
};

const environment = env.environment;

export class ApiLoadBalancerSecurityGroup extends PublicSecurityGroup {
  constructor(scope: Construct, props: ApiAlbSecurityGroupProps) {
    const { vpc } = props;
    const id = `ApiLoadBalancerSecurityGroup-${environment}`;
    const securityGroupName = `api-loadbalancer-${environment}`;
    const config: PublicSecurityGroupProps = {
      vpc,
      securityGroupName,
    };

    super(scope, id, config);
  }
}
