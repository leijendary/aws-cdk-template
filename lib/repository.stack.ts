import { Stack, StackProps } from "aws-cdk-lib";
import { Role } from "aws-cdk-lib/aws-iam";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import { RepositoryConstruct } from "../construct/repository.construct";
import env from "../env";

const { account, repositories } = env;

export class RepositoryStack extends Stack {
  constructor(scope: Construct, props: StackProps) {
    super(scope, "Repository", props);

    this.createRepositories();
  }

  private createRepositories() {
    const buildRole = Role.fromRoleName(this, "RepositoryBuildRole", "BuildRole");
    const trustPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Federated: `arn:aws:iam::${account}:oidc-provider/token.actions.githubusercontent.com`,
          },
          Action: "sts:AssumeRoleWithWebIdentity",
          Condition: {
            StringEquals: {
              "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
              "token.actions.githubusercontent.com:sub": repositories.map(({ owner, name }) => `repo:${owner}/${name}`),
            },
          },
        },
      ],
    };

    new AwsCustomResource(this, "UpdateBuildRoleTrustPolicy", {
      onUpdate: {
        service: "IAM",
        action: "updateAssumeRolePolicy",
        parameters: {
          RoleName: buildRole.roleName,
          PolicyDocument: JSON.stringify(trustPolicy),
        },
        physicalResourceId: PhysicalResourceId.of("UpdateBuildRoleTrustPolicy"),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: [buildRole.roleArn] }),
    });

    repositories.forEach(({ id, name }) => {
      const repository = new RepositoryConstruct(this, `${id}Repository`, { name });
      repository.grantPullPush(buildRole);
    });
  }
}
