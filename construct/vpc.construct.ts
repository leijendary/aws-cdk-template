import { RemovalPolicy } from "aws-cdk-lib";
import {
  AmazonLinuxCpuType,
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  Instance,
  InstanceClass,
  InstanceProps,
  InstanceSize,
  InstanceType,
  IpAddresses,
  LookupMachineImage,
  NatInstanceProps,
  NatInstanceProvider,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
  VpcProps,
} from "aws-cdk-lib/aws-ec2";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Effect, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";
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
  bastion?: Instance;

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
    this.createBastion();
  }

  private configureNatGateway() {
    if (!this.natGatewayProvider) {
      return;
    }

    this.natGatewayProvider.securityGroup.addIngressRule(Peer.ipv4(this.vpcCidrBlock), Port.allTraffic());

    const instanceId = this.natGatewayProvider.configuredGateways[0].gatewayId;

    this.createStartSchedule(instanceId);
    this.createStopSchedule(instanceId);
  }

  private createBastion() {
    // Skip bastion creation when not in production, the custom NAT gateway is used as bastion for non-prod.
    if (!isProd) {
      return;
    }

    const securityGroup = new SecurityGroup(this, `BastionSecurityGroup-${this.vpcName}-${environment}`, {
      securityGroupName: `${this.vpcName}-bastion-${environment}`,
      description: "Security Group for the Bastion Host",
      vpc: this,
    });
    const config: InstanceProps = {
      instanceName: `${this.vpcName}-bastion-${environment}`,
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.NANO),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: AmazonLinuxCpuType.ARM_64,
      }),
      vpc: this,
      securityGroup,
    };
    this.bastion = new Instance(this, `Bastion-${this.vpcName}-${environment}`, config);
    this.bastion.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"));

    this.createStartSchedule(this.bastion.instanceId);
    this.createStopSchedule(this.bastion.instanceId);
  }

  private createStartSchedule(instanceId: string) {
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:StartInstances"],
      resources: [`arn:aws:ec2:${this.stack.region}:${this.stack.account}:instance/${instanceId}`],
    });
    const lambda = new NodejsFunction(this, `Ec2InstanceStartFunction-${this.vpcName}-${environment}`, {
      functionName: `${this.vpcName}-ec2-instance-start-${environment}`,
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
    new Rule(this, `Ec2InstanceStartFunctionScheduler-${this.vpcName}-${environment}`, {
      ruleName: `${this.vpcName}-ec2-instance-start-scheduler-${environment}`,
      schedule: Schedule.cron({
        minute: "0",
        hour: "10",
      }),
      targets: [new LambdaFunction(lambda)],
    });
  }

  private createStopSchedule(instanceId: string) {
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["ec2:StopInstances"],
      resources: [`arn:aws:ec2:${this.stack.region}:${this.stack.account}:instance/${instanceId}`],
    });
    const lambda = new NodejsFunction(this, `Ec2InstanceStopFunction-${this.vpcName}-${environment}`, {
      functionName: `${this.vpcName}-ec2-instance-stop-${environment}`,
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
    new Rule(this, `Ec2InstanceStopFunctionScheduler-${this.vpcName}-${environment}`, {
      ruleName: `${this.vpcName}-ec2-instance-stop-scheduler-${environment}`,
      schedule: Schedule.cron({
        minute: "0",
        hour: "22",
      }),
      targets: [new LambdaFunction(lambda)],
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
