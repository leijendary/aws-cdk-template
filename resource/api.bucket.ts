import env, { isProd } from "@/env";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, BucketProps, HttpMethods, LifecycleRule } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

const { environment, config, organization } = env;
const { domainName } = config;

export class ApiBucket extends Bucket {
  constructor(scope: Construct) {
    const allowedOrigins = [`https://${domainName}`];

    if (!isProd) {
      allowedOrigins.push("http://localhost:3000");
    }

    const config: BucketProps = {
      bucketName: `${organization}-api-${environment}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedHeaders: ["Content-Type"],
          allowedMethods: [HttpMethods.PUT],
          allowedOrigins,
          exposedHeaders: ["Access-Control-Allow-Origin", "ETag"],
        },
      ],
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      versioned: isProd,
    };

    super(scope, `ApiBucket-${environment}`, config);

    this.addNonCurrentLifecycleRule();
    this.addIncompleteLifecycleRule();
  }

  private addNonCurrentLifecycleRule() {
    const rule: LifecycleRule = {
      id: "Delete non-current objects after 7 days",
      noncurrentVersionExpiration: Duration.days(7),
    };

    this.addLifecycleRule(rule);
  }

  private addIncompleteLifecycleRule() {
    const rule: LifecycleRule = {
      id: "Delete incomplete multipart uploads after 7 days",
      abortIncompleteMultipartUploadAfter: Duration.days(7),
      expiredObjectDeleteMarker: true,
    };

    this.addLifecycleRule(rule);
  }
}
