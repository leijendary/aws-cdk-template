import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { AuroraSecurityGroup } from "../../construct/security-group.construct";
import env from "../../env";

type ApiAuroraSecurityGroupProps = {
  vpc: Vpc;
  peer: SecurityGroup;
};

const environment = env.environment;

export class ApiAuroraSecurityGroup extends AuroraSecurityGroup {
  constructor(scope: Construct, props: ApiAuroraSecurityGroupProps) {
    const { vpc, peer } = props;
    const id = `ApiAuroraSecurityGroup-${environment}`;
    const securityGroupName = `api-aurora-${environment}`;

    super(scope, id, {
      vpc,
      securityGroupName,
      peer,
    });
  }
}
