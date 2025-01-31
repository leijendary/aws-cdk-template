import { RepositoryConstruct, RepositoryConstructProps } from "@/construct/repository.construct";
import env from "@/env";
import { Stack } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { CfnAccount, CfnOrganizationalUnit } from "aws-cdk-lib/aws-organizations";
import { Construct } from "constructs";

export type RepositoryStackProps = {
  organizationalUnit: CfnOrganizationalUnit;
  deploymentRole: string;
};

type Repository = RepositoryConstructProps & {
  id: string;
};

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
  {
    id: "WebSocketRepository",
    name: "websocket",
  },
];
const { environment, sharedAccountEmail } = env;

export class RepositoryStack extends Stack {
  sharedAccount: CfnAccount;

  constructor(scope: Construct, props: RepositoryStackProps) {
    super(scope, "RepositoryStack");

    const { organizationalUnit, deploymentRole } = props;

    this.createAccount(organizationalUnit);
    this.createRepositories(deploymentRole);
  }

  private createAccount(organizationalUnit: CfnOrganizationalUnit) {
    this.sharedAccount = new CfnAccount(this, "SharedRepositoryAccount", {
      accountName: "Shared Repository",
      email: sharedAccountEmail,
      parentIds: [organizationalUnit.attrId],
    });
  }

  private createRepositories(deploymentRole: string) {
    const role = Role.fromRoleArn(this, `RepositoryDeploymentRole-${environment}`, deploymentRole);

    repositories.forEach(({ id, name }) => {
      const repository = new RepositoryConstruct(this.sharedAccount, id, { name });
      repository.grantPullPush(role);
    });
  }
}
