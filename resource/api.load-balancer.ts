import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ApplicationProtocol,
  ListenerAction,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import env, { isProd } from "../env";

type ApiLoadBalancerProps = {
  vpc: Vpc;
  securityGroup: SecurityGroup;
  certificate: Certificate;
};

const environment = env.environment;

export class ApiLoadBalancer extends ApplicationLoadBalancer {
  securedListener: ApplicationListener;

  constructor(scope: Construct, props: ApiLoadBalancerProps) {
    const { vpc, securityGroup, certificate } = props;
    const suffix = !isProd() ? `-${environment}` : "";
    const loadBalancerName = `api-loadbalancer${suffix}`;

    super(scope, `ApiLoadBalancer-${environment}`, {
      loadBalancerName,
      vpc,
      securityGroup,
    });

    this.addRedirect();
    this.addSecuredListener(certificate);
  }

  private addSecuredListener(certificate: Certificate) {
    this.addListener(`ApiSecuredListener-${environment}`, {
      protocol: ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultAction: ListenerAction.fixedResponse(404),
    });
  }
}
