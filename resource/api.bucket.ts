import { RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, BucketProps, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import env, { isProd } from "../env";

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
  }
}
