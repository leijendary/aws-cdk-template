import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  Distribution,
  OriginRequestPolicy,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { LoadBalancerV2Origin, S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import env from "../../env";
import { KeyGroupConstruct } from "./key-group.construct";
import { OriginAccessIdentityConstruct } from "./origin-access-identity.construct";
import { PublicKeyConstruct } from "./public-key.construct";

type S3DistributionConstructProps = {
  bucket: Bucket;
  certificate: Certificate;
  hostedZone: HostedZone;
};

type AlbDistributionConstructProps = {
  certificate: Certificate;
  hostedZone: HostedZone;
  loadBalancer: ApplicationLoadBalancer;
};

const environment = env.environment;

export class S3DistributionConstruct extends Distribution {
  constructor(scope: Construct, props: S3DistributionConstructProps) {
    const { bucket, certificate, hostedZone } = props;
    const publicKey = new PublicKeyConstruct(scope);
    const keyGroup = new KeyGroupConstruct(scope, {
      publicKey,
    });
    const originAccessIdentity = new OriginAccessIdentityConstruct(scope);

    super(scope, `S3Distribution-${environment}`, {
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

export class AlbDistributionConstruct extends Distribution {
  constructor(scope: Construct, props: AlbDistributionConstructProps) {
    const { certificate, hostedZone, loadBalancer } = props;
    const publicKey = new PublicKeyConstruct(scope);
    const keyGroup = new KeyGroupConstruct(scope, {
      publicKey,
    });

    super(scope, `AlbDistribution-${environment}`, {
      certificate,
      domainNames: [`api.${hostedZone.zoneName}`],
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_ALL,
        origin: new LoadBalancerV2Origin(loadBalancer),
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
        responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
        trustedKeyGroups: [keyGroup],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });
  }
}
