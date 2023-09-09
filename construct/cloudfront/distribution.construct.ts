import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  Distribution,
  OriginRequestPolicy,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import env from "../../env";
import { KeyGroupConstruct } from "./key-group.construct";
import { OriginAccessIdentityConstruct } from "./origin-access-identity.construct";
import { PublicKeyConstruct } from "./public-key.construct";

type DistributionConstructProps = {
  bucket: Bucket;
  certificate: Certificate;
  hostedZone: HostedZone;
};

const environment = env.environment;

export class DistributionConstruct extends Distribution {
  constructor(scope: Construct, props: DistributionConstructProps) {
    const { bucket, certificate, hostedZone } = props;
    const publicKey = new PublicKeyConstruct(scope);
    const keyGroup = new KeyGroupConstruct(scope, {
      publicKey,
    });
    const originAccessIdentity = new OriginAccessIdentityConstruct(scope);

    super(scope, `Distribution-${environment}`, {
      certificate,
      domainNames: [`cdn.${hostedZone.zoneName}`],
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new S3Origin(bucket, {
          originAccessIdentity,
        }),
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
        responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
        trustedKeyGroups: [keyGroup],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });
  }
}
