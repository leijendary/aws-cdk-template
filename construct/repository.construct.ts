import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { Repository, RepositoryProps, TagStatus } from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export type RepositoryConstructProps = {
  name: string;
};

export class RepositoryConstruct extends Repository {
  constructor(scope: Construct, id: string, props: RepositoryConstructProps) {
    const { name } = props;
    const config: RepositoryProps = {
      repositoryName: name,
      removalPolicy: RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          description: "Remove untagged images older than 1 day",
          rulePriority: 1,
          tagStatus: TagStatus.UNTAGGED,
          maxImageAge: Duration.days(1),
        },
        {
          description: "Keep only up to 20 versioned images",
          rulePriority: 2,
          tagStatus: TagStatus.TAGGED,
          tagPatternList: ["*.*.*"],
          maxImageCount: 20,
        },
        {
          description: "Removed unversioned images older than 15 days",
          rulePriority: 3,
          tagStatus: TagStatus.ANY,
          maxImageAge: Duration.days(15),
        },
      ],
    };

    super(scope, id, config);
  }
}