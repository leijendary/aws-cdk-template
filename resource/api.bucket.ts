import { RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import env, { isProd } from "../env";

const environment = env.environment;
const organization = env.organization;
const { domainName } = env.config;

export class ApiBucket extends Bucket {
  constructor(scope: Construct) {
    const allowedOrigins = [`https://${domainName}`];
    let versioned = true;

    if (!isProd()) {
      allowedOrigins.push("http://localhost:3000");
      versioned = false;
    }

    super(scope, `ApiBucket-${environment}`, {
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
      removalPolicy: RemovalPolicy.RETAIN,
      versioned,
    });
  }
}
