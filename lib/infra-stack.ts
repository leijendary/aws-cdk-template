import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation } from "aws-cdk-lib/aws-certificatemanager";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { AccessKey, Policy, PolicyStatement, User } from "aws-cdk-lib/aws-iam";
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
  user: User;

  constructor(scope: Construct, props: InfraStackProps) {
    const { cidrBlock, domainName } = props;
    const id = `InfraStack-${environment}`;

    super(scope, id, props);

    this.domainName = domainName;

    this.createVpc(cidrBlock);
    this.createHostedZone();
    this.createCertificate();
    this.createUser();
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

  private createUser() {
    this.user = new User(this, `CdkUser-${environment}`, {
      userName: `cdk-user-${environment}`,
    });

    new Policy(this, `CdkPolicy-${environment}`, {
      policyName: "CDK",
      users: [this.user],
      statements: [
        new PolicyStatement({
          actions: ["sts:AssumeRole"],
          resources: ["arn:aws:iam::*:role/cdk-*"],
        }),
      ],
    });

    const accessKey = new AccessKey(this, `CdkUserAccessKey-${environment}`, {
      user: this.user,
    });
    
    console.log("CDK User Access Key ID", accessKey.accessKeyId);
    console.log("CDK User Secret Access Key", accessKey.secretAccessKey.unsafeUnwrap());
  }
}
