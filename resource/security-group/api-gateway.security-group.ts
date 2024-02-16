import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { GatewaySecurityGroup, GatewaySecurityGroupProps } from "../../construct/security-group.construct";
import env from "../../env";

type ApiGatewaySecurityGroupProps = {
  vpc: Vpc;
  peer: SecurityGroup;
};

const environment = env.environment;

export class ApiGatewaySecurityGroup extends GatewaySecurityGroup {
  constructor(scope: Construct, props: ApiGatewaySecurityGroupProps) {
    const { vpc, peer } = props;
    const config: GatewaySecurityGroupProps = {
      vpc,
      peer,
      name: "api-gateway",
    };

    super(scope, `ApiGatewaySecurityGroup-${environment}`, config);
  }
}
