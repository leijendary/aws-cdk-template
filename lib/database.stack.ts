import { Stack, StackProps } from "aws-cdk-lib";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { DatabaseCluster } from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { PublicVpcConstruct } from "../construct/vpc.construct";
import env from "../env";
import { ApiAuroraCluster } from "../resource/api.aurora";
import { ApiAuroraSecurityGroup } from "../resource/security-group/api-aurora.security-group";

export type DatabaseStackProps = StackProps & {
  vpc: PublicVpcConstruct;
  securityGroup: SecurityGroup;
};

const environment = env.environment;

export class DatabaseStack extends Stack {
  apiAuroraSecurityGroup: SecurityGroup;
  apiAuroraCluster: DatabaseCluster;

  constructor(scope: Construct, props: DatabaseStackProps) {
    super(scope, `Database-${environment}`, props);

    const { vpc, securityGroup } = props;

    this.createApiAuroraSecurityGroup(vpc, securityGroup);
    this.createApiAuroraCluster(vpc);
  }

  private createApiAuroraSecurityGroup(vpc: PublicVpcConstruct, securityGroup: SecurityGroup) {
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
