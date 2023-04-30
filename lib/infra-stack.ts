import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import env from "../env";
import { AppVpc } from "./../resource/app.vpc";
import { EnvironmentProps } from "./../types/environment";

type InfraStackProps = StackProps & EnvironmentProps;

const environment = env.environment;

export class InfraStack extends Stack {
  domainName: string;
  appVpc: Vpc;
  hostedZone: HostedZone;
  certificate: Certificate;

  constructor(scope: Construct, props: InfraStackProps) {
    const { cidrBlock, domainName } = props;
    const id = `InfraStack-${environment}`;

    super(scope, id, props);

    this.domainName = domainName;

    this.createVpc(cidrBlock);
    this.createHostedZone();
    this.createCertificate();
  }

  private createVpc(cidrBlock: string) {
    this.appVpc = new AppVpc(this, {
      cidrBlock,
    });
  }

  private createHostedZone() {
    this.hostedZone = new HostedZone(this, `HostedZone-${environment}`, {
      zoneName: this.domainName,
    });
  }

  private createCertificate() {
    this.certificate = new Certificate(this, `DomainCertificate-${environment}`, {
      domainName: `*.${this.domainName}`,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });
  }
}
