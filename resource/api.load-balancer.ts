import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { ApplicationListener, ApplicationProtocol, ListenerAction } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { LoadBalancerTarget } from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import env, { isProd } from "../env";
import { PublicLoadBalancer } from "./../construct/load-balancer.construct";

type ApiLoadBalancerProps = {
  vpc: Vpc;
  securityGroup: SecurityGroup;
  hostedZone: HostedZone;
  certificate: Certificate;
};

const environment = env.environment;

export class ApiLoadBalancer extends PublicLoadBalancer {
  securedListener: ApplicationListener;

  constructor(scope: Construct, props: ApiLoadBalancerProps) {
    const { vpc, securityGroup, certificate, hostedZone } = props;
    const suffix = isProd() ? `-${environment}` : "";
    const loadBalancerName = `api-loadbalancer${suffix}`;

    super(scope, `ApiLoadBalancer-${environment}`, {
      loadBalancerName,
      vpc,
      securityGroup,
    });

    this.addRedirect();
    this.addSecuredListener(certificate);
    this.addAlias(hostedZone);
  }

  private addSecuredListener(certificate: Certificate) {
    this.addListener(`ApiSecuredListener-${environment}`, {
      protocol: ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultAction: ListenerAction.fixedResponse(404),
    });
  }

  private addAlias(hostedZone: HostedZone) {
    const target = new LoadBalancerTarget(this);

    new ARecord(this, `ApiAliasRecord-${environment}`, {
      zone: hostedZone,
      recordName: `api.${hostedZone.zoneName}`,
      target: RecordTarget.fromAlias(target),
    });
  }
}
