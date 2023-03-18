import { Cluster, ClusterProps } from "aws-cdk-lib/aws-ecs";
import { NamespaceType } from "aws-cdk-lib/aws-servicediscovery";
import { Construct } from "constructs";

type FargateClusterConstructProps = ClusterProps & {
  domainName: string;
};

export class FargateClusterConstruct extends Cluster {
  constructor(scope: Construct, id: string, props: FargateClusterConstructProps) {
    const { domainName, ...rest } = props;
    const config: ClusterProps = {
      defaultCloudMapNamespace: {
        name: `${domainName}.local`,
        type: NamespaceType.DNS_PRIVATE,
        useForServiceConnect: true
      },
      enableFargateCapacityProviders: true,
      ...rest,
    };

    super(scope, id, config);
  }
}
