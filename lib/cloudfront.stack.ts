import { Stack, StackProps } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { ARecord, HostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { AlbDistributionConstruct, S3DistributionConstruct } from "../construct/cloudfront/distribution.construct";
import env from "../env";

type CloudFrontStackProps = StackProps & {
  bucket: Bucket;
  certificate: Certificate;
  hostedZone: HostedZone;
  loadBalancer: ApplicationLoadBalancer;
};

const environment = env.environment;

export class CloudFrontStack extends Stack {
  albDistribution: AlbDistributionConstruct;
  s3Distribution: S3DistributionConstruct;

  constructor(scope: Construct, props: CloudFrontStackProps) {
    const { bucket, certificate, hostedZone, loadBalancer } = props;

    super(scope, `CloudFrontStack-${environment}`, props);

    this.createAlbDistribution(certificate, hostedZone, loadBalancer);
    this.createS3Distribution(bucket, certificate, hostedZone);
  }

  private createAlbDistribution(
    certificate: Certificate,
    hostedZone: HostedZone,
    loadBalancer: ApplicationLoadBalancer
  ) {
    this.albDistribution = new AlbDistributionConstruct(loadBalancer, {
      loadBalancer,
      certificate,
      hostedZone,
    });

    const target = new CloudFrontTarget(this.albDistribution);

    new ARecord(this, `AlbDistributionAliasRecord-${environment}`, {
      zone: hostedZone,
      recordName: `api.${hostedZone.zoneName}`,
      target: RecordTarget.fromAlias(target),
    });
  }

  private createS3Distribution(bucket: Bucket, certificate: Certificate, hostedZone: HostedZone) {
    this.s3Distribution = new S3DistributionConstruct(bucket, {
      bucket,
      certificate,
      hostedZone,
    });

    const target = new CloudFrontTarget(this.s3Distribution);

    new ARecord(this, `S3DistributionAliasRecord-${environment}`, {
      zone: hostedZone,
      recordName: `cdn.${hostedZone.zoneName}`,
      target: RecordTarget.fromAlias(target),
    });
  }
}
