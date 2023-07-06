import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { Distribution } from "aws-cdk-lib/aws-cloudfront";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { DistributionConstruct } from "../construct/cloudfront/distribution.construct";
import env from "../env";

type CloudFrontStackProps = StackProps & {
  bucket: Bucket;
  certificate: Certificate;
  hostedZone: HostedZone;
};

const environment = env.environment;

export class CloudFrontStack extends Stack {
  distribution: Distribution;

  constructor(scope: Construct, props: CloudFrontStackProps) {
    const { bucket, certificate, hostedZone } = props;

    super(scope, `CloudFrontStack-${environment}`, props);

    this.createDistribution(bucket, certificate, hostedZone);
    this.addAlias(hostedZone);
  }

  private createDistribution(bucket: Bucket, certificate: Certificate, hostedZone: HostedZone) {
    this.distribution = new DistributionConstruct(bucket, {
      bucket,
      certificate,
      hostedZone,
    });
  }

  private addAlias(hostedZone: HostedZone) {
    const target = new CloudFrontTarget(this.distribution);

    new ARecord(this, `DistributionAliasRecord-${environment}`, {
      zone: hostedZone,
      recordName: `cdn.${hostedZone.zoneName}`,
      target: RecordTarget.fromAlias(target),
    });
  }
}
