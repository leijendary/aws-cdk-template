import { ISecurityGroup, Peer, Port, SecurityGroup, SecurityGroupProps, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import env from "../env";
import { PublicVpcConstruct } from "./vpc.construct";

export type PublicSecurityGroupProps = {
  vpc: Vpc;
  name: string
};

export type GatewaySecurityGroupProps = {
  vpc: Vpc;
  peer: SecurityGroup;
  name: string
};

export type PeerSecurityGroupProps = {
  vpc: Vpc;
  peer: SecurityGroup;
  name: string
};

export type AuroraSecurityGroupProps = {
  vpc: PublicVpcConstruct;
  peer: SecurityGroup;
  name: string
};

const defaults: Partial<SecurityGroupProps> = {
  allowAllOutbound: true,
  allowAllIpv6Outbound: true,
};

const environment = env.environment;

export class PublicSecurityGroup extends SecurityGroup {
  constructor(scope: Construct, id: string, props: PublicSecurityGroupProps) {
    const { vpc, name } = props;
    const config: SecurityGroupProps = {
      vpc,
      securityGroupName: `${name}-${environment}`
      ...defaults,
    };

    super(scope, id, config);

    this.securedRules();
  }

  private securedRules() {
    const https = Port.tcp(443);

    this.addIngressRule(Peer.anyIpv4(), https, "All outside IPv4");
    this.addIngressRule(Peer.anyIpv6(), https, "All outside IPv6");
  }
}

export class GatewaySecurityGroup extends SecurityGroup {
  constructor(scope: Construct, id: string, props: GatewaySecurityGroupProps) {
    const { vpc, peer, name } = props;
    const config: SecurityGroupProps = {
      vpc,
      securityGroupName: `${name}-${environment}`,
      ...defaults,
    };

    super(scope, id, config);

    this.addRule(peer);
  }

  private addRule(peer: SecurityGroup) {
    const https = Port.tcp(443);

    this.addIngressRule(peer, https, "Allow peer to connect only in HTTPS.");
  }
}

export class PeerSecurityGroup extends SecurityGroup {
  constructor(scope: Construct, id: string, props: PeerSecurityGroupProps) {
    const { vpc, peer, name } = props;
    const config: SecurityGroupProps = {
      vpc,
      securityGroupName: `${name}-${environment}`,
      ...defaults,
    };

    super(scope, id, config);

    this.addRules(peer);
  }

  private addRules(peer: SecurityGroup) {
    const http = Port.tcp(80);
    const https = Port.tcp(443);

    this.addIngressRule(peer, http, "Allow peer to connect in HTTP");
    this.addIngressRule(peer, https, "Allow peer to connect in HTTPS");
    this.addIngressRule(this, http, "Allow self to connect in HTTP");
    this.addIngressRule(this, https, "Allow self to connect in HTTPS");
  }
}

export class AuroraSecurityGroup extends SecurityGroup {
  constructor(scope: Construct, id: string, props: AuroraSecurityGroupProps) {
    const { vpc, peer, name } = props;
    const config: SecurityGroupProps = {
      vpc,
      securityGroupName: `${name}-${environment}`
    };

    super(scope, id, config);

    this.addRules(peer, vpc?.natGatewayProvider?.securityGroup);
  }

  private addRules(peer: SecurityGroup, natGateway?: ISecurityGroup) {
    const postgres = Port.tcp(5432);

    this.addIngressRule(peer, postgres, "Allow service to connect to PostgreSQL");

    if (!!natGateway) {
      this.addIngressRule(natGateway, postgres, "Allow custom NAT Gateway to connect to PostgreSQL");
    }
  }
}
