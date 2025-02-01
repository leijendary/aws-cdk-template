import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { AuroraSecurityGroup, AuroraSecurityGroupProps } from "../../construct/security-group.construct";
import { PublicVpcConstruct } from "../../construct/vpc.construct";
import env from "../../env";

export type ApiAuroraSecurityGroupProps = {
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
      name: `api-aurora`,
    };

    super(scope, `ApiAuroraSecurityGroup-${environment}`, config);
  }
}
