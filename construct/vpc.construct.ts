import { RemovalPolicy } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  IpAddresses,
  LookupMachineImage,
  NatInstanceProps,
  NatInstanceProvider,
  Peer,
  Port,
  SubnetType,
  Vpc,
  VpcProps,
} from "aws-cdk-lib/aws-ec2";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import env, { isProd } from "../env";

const { environment } = env;

export type PublicVpcConstructProps = VpcProps & {
  cidrBlock: string;
};

export class PublicVpcConstruct extends Vpc {
  constructor(scope: Construct, id: string, props: PublicVpcConstructProps) {
    const { cidrBlock, ...rest } = props;
    const natGatewayProvider = getNatGatewayProvider();
    const config: VpcProps = {
      vpcName: id,
      ipAddresses: IpAddresses.cidr(cidrBlock),
      maxAzs: 2,
      natGateways: isProd ? 2 : 1,
      subnetConfiguration: [
        {
          name: "Public",
          cidrMask: 22,
          subnetType: SubnetType.PUBLIC,
          mapPublicIpOnLaunch: false,
        },
        {
          name: "Private",
          cidrMask: 18,
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: "PrivateIsolated",
          cidrMask: 22,
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGatewayProvider,
      ...rest,
    };

    super(scope, id, config);

    this.configureNatGateway(props.vpcName!!, natGatewayProvider);
  }

  private configureNatGateway(name: string, natGatewayProvider?: NatInstanceProvider) {
    if (!natGatewayProvider) {
      return;
    }

    natGatewayProvider.securityGroup.addIngressRule(Peer.ipv4(this.vpcCidrBlock), Port.allTraffic());

    this.createStartSchedule(name, natGatewayProvider.configuredGateways[0].gatewayId);
    this.createStopSchedule(name, natGatewayProvider.configuredGateways[0].gatewayId);
  }

  private createStartSchedule(name: string, instanceId: string) {
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:StartInstances"],
      resources: [`arn:aws:ec2:${this.stack.region}:${this.stack.account}:instance/${instanceId}`],
    });
    const lambda = new NodejsFunction(this, `Ec2InstanceStartFunction-${name}-${environment}`, {
      functionName: `${name}-ec2-instance-start`,
      entry: "function/ec2-instance-start.ts",
      environment: {
        INSTANCE_ID: instanceId,
      },
    });
    lambda.addToRolePolicy(policyStatement);

    new LogGroup(this, `Ec2InstanceStartFunctionLogGroup-${name}-${environment}`, {
      logGroupName: `/aws/lambda/${lambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });

    const target = new LambdaFunction(lambda);

    new Rule(this, `Ec2InstanceStartFunctionScheduler-${name}-${environment}`, {
      ruleName: `${name}-ec2-instance-start-scheduler`,
      schedule: Schedule.cron({
        minute: "0",
        hour: "10",
      }),
      targets: [target],
    });
  }

  private createStopSchedule(name: string, instanceId: string) {
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:StopInstances"],
      resources: [`arn:aws:ec2:${this.stack.region}:${this.stack.account}:instance/${instanceId}`],
    });
    const lambda = new NodejsFunction(this, `Ec2InstanceStopFunction-${name}-${environment}`, {
      functionName: `${name}-ec2-instance-stop`,
      entry: "function/ec2-instance-stop.ts",
      environment: {
        INSTANCE_ID: instanceId,
      },
    });
    lambda.addToRolePolicy(policyStatement);

    new LogGroup(this, `Ec2InstanceStopFunctionLogGroup-${name}-${environment}`, {
      logGroupName: `/aws/lambda/${lambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });

    const target = new LambdaFunction(lambda);

    new Rule(this, `Ec2InstanceStopFunctionScheduler-${name}-${environment}`, {
      ruleName: `${name}-ec2-instance-stop-scheduler`,
      schedule: Schedule.cron({
        minute: "0",
        hour: "22",
      }),
      targets: [target],
    });
  }
}

function getNatGatewayProvider() {
  if (isProd) {
    return;
  }

  // https://fck-nat.dev/stable/deploying
  const config: NatInstanceProps = {
    instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.NANO),
    machineImage: new LookupMachineImage({
      name: "fck-nat-al2023-*-arm64-ebs",
      owners: ["568608671756"],
    }),
  };

  return new NatInstanceProvider(config);
}
