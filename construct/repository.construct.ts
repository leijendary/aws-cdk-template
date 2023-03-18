import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { Repository, RepositoryEncryption, RepositoryProps, TagStatus } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export type RepositoryConstructProps = {
  id: string;
  name: string;
};

export class RepositoryConstruct extends Repository {
  constructor(scope: Construct, props: RepositoryConstructProps) {
    const { id, name } = props;
    const config: RepositoryProps = {
      repositoryName: name,
      encryption: RepositoryEncryption.KMS,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          description: "Remove untagged image older than 1 day",
          rulePriority: 1,
          tagStatus: TagStatus.UNTAGGED,
          maxImageAge: Duration.days(1),
        },
        {
          description: "Keep only up to 20 images",
          rulePriority: 2,
          tagStatus: TagStatus.ANY,
          maxImageCount: 20,
        },
      ],
    };

    super(scope, `${id}Repository`, config);
  }
}
