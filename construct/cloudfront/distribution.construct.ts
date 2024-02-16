import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  Distribution,
  DistributionProps,
  OriginAccessIdentity,
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
    const config: DistributionProps = {
      certificate,
      domainNames: [`cdn.${hostedZone.zoneName}`],
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new S3Origin(bucket, {
          originAccessIdentity: new OriginAccessIdentity(scope, `OriginAccessIdentity-${environment}`),
        }),
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
        responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
        trustedKeyGroups: [
          new KeyGroupConstruct(scope, {
            publicKey: new PublicKeyConstruct(scope),
          }),
        ],
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    };

    super(scope, `S3Distribution-${environment}`, config);
  }
}

export class AlbDistributionConstruct extends Distribution {
  constructor(scope: Construct, props: AlbDistributionConstructProps) {
    const { certificate, hostedZone, loadBalancer } = props;
    const config: DistributionProps = {
      certificate,
      domainNames: [`api.${hostedZone.zoneName}`],
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_ALL,
        origin: new LoadBalancerV2Origin(loadBalancer),
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
        responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    };

    super(scope, `AlbDistribution-${environment}`, config);
  }
}
