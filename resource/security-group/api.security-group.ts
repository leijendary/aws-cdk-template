import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { PeerSecurityGroup, PeerSecurityGroupProps } from "../../construct/security-group.construct";
import env from "../../env";

type ApiSecurityGroupProps = {
  vpc: Vpc;
  peer: SecurityGroup;
};

const environment = env.environment;

export class ApiSecurityGroup extends PeerSecurityGroup {
  constructor(scope: Construct, props: ApiSecurityGroupProps) {
    const { vpc, peer } = props;
    const config: PeerSecurityGroupProps = {
      vpc,
      peer,
      securityGroupName: `api-${environment}`,
    };

    super(scope, `ApiSecurityGroup-${environment}`, config);
  }
}
