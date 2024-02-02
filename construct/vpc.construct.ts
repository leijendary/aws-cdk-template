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

const { environment, config } = env;
const { cidrBlock } = config;

export type PublicVpcConstructProps = VpcProps & {
  vpcName: string;
};

export class PublicVpcConstruct extends Vpc {
  vpcName: string;
  natGatewayProvider?: NatInstanceProvider;

  constructor(scope: Construct, id: string, props: PublicVpcConstructProps) {
    const natGatewayProvider = getNatGatewayProvider();
    const config: VpcProps = {
      maxAzs: isProd ? 2 : 1,
      natGateways: isProd ? 2 : 1,
      ipAddresses: IpAddresses.cidr(cidrBlock),
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
      ...props,
    };

    super(scope, id, config);

    this.vpcName = props.vpcName;
    this.natGatewayProvider = natGatewayProvider;
    this.configureNatGateway();
  }

  private configureNatGateway() {
    if (!this.natGatewayProvider) {
      return;
    }

    this.natGatewayProvider.securityGroup.addIngressRule(Peer.ipv4(this.vpcCidrBlock), Port.allTraffic());

    this.createStartSchedule();
    this.createStopSchedule();
  }

  private createStartSchedule() {
    const instanceId = this.natGatewayProvider!!.configuredGateways[0].gatewayId;
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:StartInstances"],
      resources: [`arn:aws:ec2:${this.stack.region}:${this.stack.account}:instance/${instanceId}`],
    });
    const lambda = new NodejsFunction(this, `Ec2InstanceStartFunction-${this.vpcName}-${environment}`, {
      functionName: `${this.vpcName}-ec2-instance-start`,
      entry: "function/ec2-instance-start.ts",
      environment: {
        INSTANCE_ID: instanceId,
      },
    });
    lambda.addToRolePolicy(policyStatement);

    new LogGroup(this, `Ec2InstanceStartFunctionLogGroup-${this.vpcName}-${environment}`, {
      logGroupName: `/aws/lambda/${lambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });

    const target = new LambdaFunction(lambda);

    new Rule(this, `Ec2InstanceStartFunctionScheduler-${this.vpcName}-${environment}`, {
      ruleName: `${this.vpcName}-ec2-instance-start-scheduler`,
      schedule: Schedule.cron({
        minute: "0",
        hour: "10",
      }),
      targets: [target],
    });
  }

  private createStopSchedule() {
    const instanceId = this.natGatewayProvider!!.configuredGateways[0].gatewayId;
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:StopInstances"],
      resources: [`arn:aws:ec2:${this.stack.region}:${this.stack.account}:instance/${instanceId}`],
    });
    const lambda = new NodejsFunction(this, `Ec2InstanceStopFunction-${this.vpcName}-${environment}`, {
      functionName: `${this.vpcName}-ec2-instance-stop`,
      entry: "function/ec2-instance-stop.ts",
      environment: {
        INSTANCE_ID: instanceId,
      },
    });
    lambda.addToRolePolicy(policyStatement);

    new LogGroup(this, `Ec2InstanceStopFunctionLogGroup-${this.vpcName}-${environment}`, {
      logGroupName: `/aws/lambda/${lambda.functionName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.FIVE_DAYS,
    });

    const target = new LambdaFunction(lambda);

    new Rule(this, `Ec2InstanceStopFunctionScheduler-${this.vpcName}-${environment}`, {
      ruleName: `${this.vpcName}-ec2-instance-stop-scheduler`,
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
