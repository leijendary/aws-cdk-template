import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, ClusterProps } from "aws-cdk-lib/aws-ecs";
import { NamespaceType } from "aws-cdk-lib/aws-servicediscovery";
import { Construct } from "constructs";
import env from "../env";

export type FargateClusterProps = {
  vpc: Vpc;
  name: string;
};

const environment = env.environment;
const { domainName } = env.config;

export class FargateCluster extends Cluster {
  constructor(scope: Construct, id: string, props: FargateClusterProps) {
    const { vpc, name } = props;
    const config: ClusterProps = {
      clusterName: `${name}-${environment}`,
      defaultCloudMapNamespace: {
        name: `${domainName}.local`,
        type: NamespaceType.DNS_PRIVATE,
        useForServiceConnect: true,
      },
      enableFargateCapacityProviders: true,
      vpc,
    };

    super(scope, id, config);
  }
}
