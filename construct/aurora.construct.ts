import { Duration, RemovalPolicy } from "aws-cdk-lib";
import { SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import {
  AuroraPostgresEngineVersion,
  ClusterInstance,
  Credentials,
  DBClusterStorageType,
  DatabaseCluster,
  DatabaseClusterEngine,
  DatabaseClusterProps,
  IClusterInstance,
} from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import env, { isProd } from "../env";

export type AuroraConstructProps = {
  vpc: Vpc;
  name: string;
  securityGroup: SecurityGroup;
};

const environment = env.environment;

export class AuroraConstruct extends DatabaseCluster {
  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    const { vpc, name, securityGroup } = props;
    let readers: IClusterInstance[] = [];

    if (isProd) {
      const reader = ClusterInstance.serverlessV2("reader", { scaleWithWriter: true });
      readers.push(reader);
    }

    const credentials = createCredentials(scope, name);
    const config: DatabaseClusterProps = {
      clusterIdentifier: `${name}-${environment}`,
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_15_5,
      }),
      serverlessV2MinCapacity: isProd ? 1 : 0.5,
      serverlessV2MaxCapacity: isProd ? 16 : 1,
      writer: ClusterInstance.serverlessV2("writer"),
      readers,
      storageType: isProd ? DBClusterStorageType.AURORA_IOPT1 : DBClusterStorageType.AURORA,
      credentials,
      backup: {
        retention: Duration.days(isProd ? 30 : 7),
      },
      storageEncrypted: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [securityGroup],
      preferredMaintenanceWindow: "Tue:22:30-Wed:23:00",
    };

    super(scope, id, config);
  }
}

function createCredentials(scope: Construct, name: string) {
  const secret = Secret.fromSecretNameV2(scope, `AuroraSecret-${name}-${environment}`, `${name}-aurora-${environment}`);

  return Credentials.fromSecret(secret);
}
