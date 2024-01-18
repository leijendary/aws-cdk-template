import { Cluster, ClusterProps } from "aws-cdk-lib/aws-ecs";
import { NamespaceType } from "aws-cdk-lib/aws-servicediscovery";
import { Construct } from "constructs";
import env from "../env";

const { domainName } = env.config;

export class FargateClusterConstruct extends Cluster {
  constructor(scope: Construct, id: string, props: ClusterProps) {
    const config: ClusterProps = {
      defaultCloudMapNamespace: {
        name: `${domainName}.local`,
        type: NamespaceType.DNS_PRIVATE,
        useForServiceConnect: true,
      },
      enableFargateCapacityProviders: true,
      ...props,
    };

    super(scope, id, config);
  }
}
