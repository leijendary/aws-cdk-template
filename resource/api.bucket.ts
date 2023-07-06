import { RemovalPolicy } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import env, { isProd } from "../env";

const environment = env.environment;
const organization = env.organization;

export class ApiBucket extends Bucket {
  constructor(scope: Construct) {
    super(scope, `ApiBucket-${environment}`, {
      bucketName: `${organization}-api-${environment}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      versioned: isProd(),
    });
  }
}
