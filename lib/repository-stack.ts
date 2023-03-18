import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { RepositoryConstruct, RepositoryConstructProps } from "../construct/repository.construct";
import env from "../env";

const environment = env.environment;
const repositories: RepositoryConstructProps[] = [
  {
    id: "ApiGatewayRepository",
    name: "api-gateway",
  },
  {
    id: "IAMRepository",
    name: "iam",
  },
  {
    id: "SampleRepository",
    name: "sample",
  },
];

export class RepositoryStack extends Stack {
  constructor(scope: Construct, props: StackProps) {
    const id = `RepositoryStack-${environment}`;

    super(scope, id, props);

    this.create();
  }

  private create() {
    repositories.forEach((repository) => new RepositoryConstruct(this, repository));
  }
}
