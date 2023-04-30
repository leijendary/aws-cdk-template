import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { ApplicationListener, ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import env from "../env";
import { ApiFargateCluster } from "../resource/api.ecs";
import { ApiLoadBalancer } from "../resource/api.load-balancer";
import { ApiGatewaySecurityGroup } from "../resource/security-group/api-gateway.security-group";
import { ApiLoadBalancerSecurityGroup } from "../resource/security-group/api-loadbalancer.security-group";
import { ApiSecurityGroup } from "../resource/security-group/api.security-group";
import { EnvironmentProps } from "../types/environment";

type ApiStackProps = StackProps &
  EnvironmentProps & {
    vpc: Vpc;
    hostedZone: HostedZone;
    certificate: Certificate;
  };

const environment = env.environment;

export class ApiStack extends Stack {
  loadBalancerSecurityGroup: SecurityGroup;
  gatewaySecurityGroup: SecurityGroup;
  securityGroup: SecurityGroup;
  loadBalancer: ApplicationLoadBalancer;
  listener: ApplicationListener;
  cluster: Cluster;

  constructor(scope: Construct, props: ApiStackProps) {
    const { domainName, vpc, hostedZone, certificate } = props;
    const id = `ApiStack-${environment}`;

    super(scope, id, props);

    this.createLoadBalancerSecurityGroup(vpc);
    this.createGatewaySecurityGroup(vpc);
    this.createSecurityGroup(vpc);
    this.createLoadBalancer(vpc, hostedZone, certificate);
    this.createFargateCluster(domainName, vpc);
  }

  private createLoadBalancerSecurityGroup(vpc: Vpc) {
    this.loadBalancerSecurityGroup = new ApiLoadBalancerSecurityGroup(this, {
      vpc,
    });
  }

  private createGatewaySecurityGroup(vpc: Vpc) {
    this.gatewaySecurityGroup = new ApiGatewaySecurityGroup(this, {
      vpc,
      peer: this.loadBalancerSecurityGroup,
    });
  }

  private createSecurityGroup(vpc: Vpc) {
    this.securityGroup = new ApiSecurityGroup(this, {
      vpc,
      peer: this.gatewaySecurityGroup,
    });
  }

  private createLoadBalancer(vpc: Vpc, hostedZone: HostedZone, certificate: Certificate) {
    const loadBalancer = new ApiLoadBalancer(this, {
      vpc,
      securityGroup: this.loadBalancerSecurityGroup,
      hostedZone,
      certificate,
    });

    this.loadBalancer = loadBalancer;
    this.listener = loadBalancer.securedListener;
  }

  private createFargateCluster(domainName: string, vpc: Vpc) {
    this.cluster = new ApiFargateCluster(this, {
      domainName,
      vpc,
    });
  }
}
