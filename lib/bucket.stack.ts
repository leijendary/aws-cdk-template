import env from "@/env";
import { ApiBucket } from "@/resource/api.bucket";
import { Stack, StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

type BucketStackProps = StackProps;

const environment = env.environment;

export class BucketStack extends Stack {
  bucket: Bucket;

  constructor(scope: Construct, props: BucketStackProps) {
    super(scope, `Bucket-${environment}`, props);

    this.createBucket();
  }

  private createBucket() {
    this.bucket = new ApiBucket(this);
  }
}
