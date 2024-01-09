import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import env from "../env";

type CertificateStackProps = StackProps & {
  hostedZone: HostedZone;
};

const { environment, config } = env;
const { domainName } = config;

export class CertificateStack extends Stack {
  certificate: Certificate;

  constructor(scope: Construct, props: CertificateStackProps) {
    super(scope, `CertificateStack-${environment}`, props);

    const { hostedZone } = props;

    this.createCertificate(hostedZone);
  }

  private createCertificate(hostedZone: HostedZone) {
    this.certificate = new Certificate(this, `RegionalCertificate-${environment}`, {
      domainName: `*.${domainName}`,
      validation: CertificateValidation.fromDns(hostedZone),
    });
  }
}
