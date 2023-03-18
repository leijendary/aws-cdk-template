import { Aspects, Duration, RemovalPolicy } from "aws-cdk-lib";
import { InstanceType, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  AuroraPostgresEngineVersion,
  CfnDBCluster,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseClusterProps,
  DatabaseSecret,
} from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import env, { isProd } from "../env";

type AuroraConstructProps = {
  vpc: Vpc;
  name: string;
  clusterIdentifier: string;
  username: string;
  securityGroup: SecurityGroup;
};

const environment = env.environment;

export class AuroraConstruct extends DatabaseCluster {
  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    const { vpc, name, clusterIdentifier, username, securityGroup } = props;
    const databaseSecret = createSecret(scope, id, name, username);
    const config: DatabaseClusterProps = {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_14_6,
      }),
      instances: isProd() ? 2 : 1,
      instanceProps: {
        vpc,
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        instanceType: new InstanceType("serverless"),
        securityGroups: [securityGroup],
      },
      clusterIdentifier,
      credentials: Credentials.fromSecret(databaseSecret, username),
      backup: {
        retention: Duration.days(7),
      },
      storageEncrypted: true,
      removalPolicy: isProd() ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    };

    super(scope, id, config);

    this.setScaling();
  }

  private setScaling() {
    // Add capacity to the db cluster to enable scaling
    Aspects.of(this).add({
      visit(node) {
        if (node instanceof CfnDBCluster) {
          node.serverlessV2ScalingConfiguration = {
            minCapacity: isProd() ? 1 : 0.5,
            maxCapacity: isProd() ? 16 : 1,
          };
        }
      },
    });
  }
}

const createSecret = (scope: Construct, id: string, name: string, username: string) => {
  return new DatabaseSecret(scope, `${id}AuroraSecret-${environment}`, {
    secretName: `${name}-aurora-${environment}`,
    username,
  });
};
