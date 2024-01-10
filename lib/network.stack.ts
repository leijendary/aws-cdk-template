import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import env from "../env";
import { AppVpc } from "../resource/app.vpc";

type NetworkStackProps = StackProps;

const { environment, config } = env;
const { domainName } = config;

export class NetworkStack extends Stack {
  vpc: Vpc;
  hostedZone: HostedZone;
  certificate: Certificate;

  constructor(scope: Construct, props: NetworkStackProps) {
    super(scope, `Network-${environment}`, props);

    this.createVpc();
    this.createHostedZone();
    this.createCertificate();
  }

  private createVpc() {
    this.vpc = new AppVpc(this);
  }

  private createHostedZone() {
    this.hostedZone = new HostedZone(this, `HostedZone-${environment}`, {
      zoneName: domainName,
    });
  }

  private createCertificate() {
    this.certificate = new Certificate(this, `DomainCertificate-${environment}`, {
      domainName: `*.${domainName}`,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });
  }
}
