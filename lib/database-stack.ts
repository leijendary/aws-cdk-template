import { Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { DatabaseCluster } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import env from "../env";
import { ApiAuroraCluster } from "../resource/api.aurora";
import { ApiAuroraSecurityGroup } from "../resource/security-group/api-aurora.security-group";
import { EnvironmentProps } from "../types/environment";

type DatabaseStackProps = StackProps &
  EnvironmentProps & {
    vpc: Vpc;
    apiSecurityGroup: SecurityGroup;
  };

const environment = env.environment;

export class DatabaseStack extends Stack {
  apiAuroraSecurityGroup: SecurityGroup;
  apiAuroraCluster: DatabaseCluster;

  constructor(scope: Construct, props: DatabaseStackProps) {
    const { vpc, apiSecurityGroup } = props;
    const id = `DatabaseStack-${environment}`;

    super(scope, id, props);

    this.createApiAuroraSecurityGroup(vpc, apiSecurityGroup);
    this.createApiAuroraCluster(vpc);
  }

  private createApiAuroraSecurityGroup(vpc: Vpc, securityGroup: SecurityGroup) {
    this.apiAuroraSecurityGroup = new ApiAuroraSecurityGroup(this, {
      vpc,
      peer: securityGroup,
    });
  }

  private createApiAuroraCluster(vpc: Vpc) {
    this.apiAuroraCluster = new ApiAuroraCluster(this, {
      vpc,
      securityGroup: this.apiAuroraSecurityGroup,
    });
  }
}
