import { Vpc } from "aws-cdk-lib/aws-ec2";
import { ClusterProps } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import env from "../env";
import { FargateClusterConstruct } from "./../construct/ecs.construct";

type ApiFargateClusterProps = {
  vpc: Vpc;
};

const { environment } = env;

export class ApiFargateCluster extends FargateClusterConstruct {
  constructor(scope: Construct, props: ApiFargateClusterProps) {
    const { vpc } = props;
    const config: ClusterProps = {
      vpc,
      clusterName: `api-${environment}`,
    };

    super(scope, `ApiFargateCluster-${environment}`, config);
  }
}
