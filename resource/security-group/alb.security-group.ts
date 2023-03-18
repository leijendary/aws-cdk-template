import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { PublicSecurityGroup } from "../../construct/security-group.construct";
import env from "../../env";

type ApiAlbSecurityGroupProps = {
  vpc: Vpc;
};

const environment = env.environment;

export class ApiAlbSecurityGroup extends PublicSecurityGroup {
  constructor(scope: Construct, props: ApiAlbSecurityGroupProps) {
    const { vpc } = props;
    const id = `ApiAlbSecurityGroup-${environment}`;
    const securityGroupName = `api-loadbalancer-${environment}`;

    super(scope, id, {
      vpc,
      securityGroupName,
    });
  }
}
