import { Aspects, Duration, RemovalPolicy } from "aws-cdk-lib";
import { InstanceType, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  AuroraPostgresEngineVersion,
  CfnDBCluster,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseClusterProps,
} from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env, { isProd } from "../env";

type AuroraConstructProps = {
  vpc: Vpc;
  name: string;
  securityGroup: SecurityGroup;
};

const environment = env.environment;

export class AuroraConstruct extends DatabaseCluster {
  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    const { vpc, name, securityGroup } = props;
    const credentials = createCredentials(scope, name);
    const config: DatabaseClusterProps = {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_15_2,
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
      clusterIdentifier: `${name}-${environment}`,
      credentials,
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

const createCredentials = (scope: Construct, name: string) => {
  const secret = Secret.fromSecretNameV2(scope, `AuroraSecret-${name}-${environment}`, `${name}-aurora-${environment}`);

  return Credentials.fromSecret(secret);
};
