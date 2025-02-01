import { CfnResource, Stack, StackProps } from "aws-cdk-lib";
import { EventAction, FilterGroup, Project, ProjectProps, Source } from "aws-cdk-lib/aws-codebuild";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import env from "../env";

const repositories = env.repositories;

/**
 * For this to work, a GitHub connection with AWS must be done first.
 * Read more: https://docs.aws.amazon.com/codebuild/latest/userguide/action-runner.html
 */
export class CodeBuildStack extends Stack {
  constructor(scope: Construct, props: StackProps) {
    super(scope, "CodeBuild", props);

    this.createProjects();
  }

  private createProjects() {
    const codeConnectionPolicy = new Policy(this, "CodeConnectionPolicy", {
      policyName: "CodeConnection",
      statements: [
        new PolicyStatement({
          actions: ["codeconnections:GetConnectionToken", "codeconnections:GetConnection"],
          resources: ["*"],
        }),
      ],
    });

    repositories.forEach(({ id, owner, name }) => {
      const config: ProjectProps = {
        projectName: name,
        source: Source.gitHub({
          owner,
          repo: name,
          webhookFilters: [FilterGroup.inEventOf(EventAction.WORKFLOW_JOB_QUEUED)],
        }),
      };
      const project = new Project(this, `${id}Project`, config);
      project.role!.attachInlinePolicy(codeConnectionPolicy);
      (project.node.defaultChild as CfnResource).addDependency(codeConnectionPolicy.node.defaultChild as CfnResource);
    });
  }
}
