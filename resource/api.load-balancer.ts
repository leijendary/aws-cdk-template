import env, { isProd } from "@/env";
import { Duration } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  ApplicationListener,
  ApplicationLoadBalancer,
  ApplicationLoadBalancerProps,
  ApplicationProtocol,
  ListenerAction,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

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
    const suffix = !isProd ? `-${environment}` : "";
    const config: ApplicationLoadBalancerProps = {
      vpc,
      securityGroup,
      loadBalancerName: `api-loadbalancer${suffix}`,
      idleTimeout: Duration.minutes(5),
    };

    super(scope, `ApiLoadBalancer-${environment}`, config);

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
