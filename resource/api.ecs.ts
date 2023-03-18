import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import env from "../env";
import { FargateClusterConstruct } from "./../construct/ecs.construct";

type ApiFargateClusterProps = {
  domainName: string;
  vpc: Vpc;
};

const environment = env.environment;

export class ApiFargateCluster extends FargateClusterConstruct {
  constructor(scope: Construct, props: ApiFargateClusterProps) {
    const { domainName, vpc } = props;
    const clusterName = `api-cluster-${environment}`;

    super(scope, `ApiCluster-${environment}`, {
      clusterName,
      domainName,
      vpc,
    });
  }
}
