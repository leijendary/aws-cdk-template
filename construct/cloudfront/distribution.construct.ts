import { KeyGroupConstruct } from "@/construct/cloudfront/key-group.construct";
import { PublicKeyConstruct } from "@/construct/cloudfront/public-key.construct";
import env from "@/env";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  BehaviorOptions,
  Distribution,
  DistributionProps,
  OriginAccessIdentity,
  OriginRequestPolicy,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { LoadBalancerV2Origin, S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

type S3DistributionConstructProps = {
  bucket: Bucket;
  certificate: Certificate;
  hostedZone: HostedZone;
  behaviors?: {
    public?: string[];
    private?: string[];
  };
};

type AlbDistributionConstructProps = {
  certificate: Certificate;
  hostedZone: HostedZone;
  loadBalancer: ApplicationLoadBalancer;
};

const environment = env.environment;

export class S3DistributionConstruct extends Distribution {
  constructor(scope: Construct, props: S3DistributionConstructProps) {
    const { bucket, certificate, hostedZone, behaviors } = props;
    const origin = S3BucketOrigin.withOriginAccessIdentity(bucket, {
      originAccessIdentity: new OriginAccessIdentity(scope, `OriginAccessIdentity-${environment}`),
    });
    const publicBehavior: BehaviorOptions = {
      origin,
      originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
      responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT_AND_SECURITY_HEADERS,
    };
    const privateBehavior: BehaviorOptions = {
      ...publicBehavior,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      trustedKeyGroups: [
        new KeyGroupConstruct(scope, {
          publicKey: new PublicKeyConstruct(scope),
        }),
      ],
    };
    const additionalBehaviors: Record<string, BehaviorOptions> = {};
    behaviors?.public?.forEach((path) => (additionalBehaviors[path] = publicBehavior));
    behaviors?.private?.forEach((path) => (additionalBehaviors[path] = privateBehavior));

    const config: DistributionProps = {
      certificate,
      domainNames: [`cdn.${hostedZone.zoneName}`],
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: privateBehavior,
      additionalBehaviors,
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
