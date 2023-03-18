import { ApplicationLoadBalancer, ApplicationLoadBalancerProps } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

type PublicLoadBalancerProps = ApplicationLoadBalancerProps;

export class PublicLoadBalancer extends ApplicationLoadBalancer {
  constructor(scope: Construct, id: string, props: PublicLoadBalancerProps) {
    const { ...rest } = props;
    const config: ApplicationLoadBalancerProps = {
      internetFacing: true,
      ...rest,
    };

    super(scope, id, config);
  }
}
