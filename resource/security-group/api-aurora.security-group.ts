import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { AuroraSecurityGroup, AuroraSecurityGroupProps } from "../../construct/security-group.construct";
import { PublicVpcConstruct } from "../../construct/vpc.construct";
import env from "../../env";

type ApiAuroraSecurityGroupProps = {
  vpc: PublicVpcConstruct;
  peer: SecurityGroup;
};

const environment = env.environment;

export class ApiAuroraSecurityGroup extends AuroraSecurityGroup {
  constructor(scope: Construct, props: ApiAuroraSecurityGroupProps) {
    const { vpc, peer } = props;
    const config: AuroraSecurityGroupProps = {
      vpc,
      peer,
      securityGroupName: `api-aurora-${environment}`,
    };

    super(scope, `ApiAuroraSecurityGroup-${environment}`, config);
  }
}
