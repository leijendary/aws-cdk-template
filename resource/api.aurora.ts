import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { AuroraConstruct } from "../construct/aurora.construct";
import env from "../env";

type ApiAuroraClusterProps = {
  vpc: Vpc;
  securityGroup: SecurityGroup;
};

const environment = env.environment;

export class ApiAuroraCluster extends AuroraConstruct {
  constructor(scope: Construct, props: ApiAuroraClusterProps) {
    const { vpc, securityGroup } = props;
    const name = "api";

    super(scope, `ApiAuroraCluster-${environment}`, {
      vpc,
      name,
      securityGroup,
    });
  }
}
