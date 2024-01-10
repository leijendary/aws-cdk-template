import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RepositoryConstruct, RepositoryConstructProps } from "../construct/repository.construct";
import env from "../env";

type Repository = RepositoryConstructProps & {
  id: string;
};

const environment = env.environment;
const repositories: Repository[] = [
  {
    id: "ApiGatewayRepository",
    name: "api-gateway",
  },
  {
    id: "IamRepository",
    name: "iam",
  },
  {
    id: "NotificationRepository",
    name: "notification",
  },
  {
    id: "SampleRepository",
    name: "sample",
  },
];

export class RepositoryStack extends Stack {
  constructor(scope: Construct, props: StackProps) {
    super(scope, `Repository-${environment}`, props);

    this.create();
  }

  private create() {
    repositories.forEach(({ id, name }) => new RepositoryConstruct(this, `${id}-${environment}`, { name }));
  }
}
