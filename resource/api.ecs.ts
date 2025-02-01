import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { FargateCluster, FargateClusterProps } from "../construct/ecs.construct";
import env from "../env";

export type ApiFargateClusterProps = {
  vpc: Vpc;
};

const environment = env.environment;

export class ApiFargateCluster extends FargateCluster {
  constructor(scope: Construct, props: ApiFargateClusterProps) {
    const { vpc } = props;
    const config: FargateClusterProps = {
      vpc,
      name: "api",
    };

    super(scope, `ApiFargateCluster-${environment}`, config);
  }
}
