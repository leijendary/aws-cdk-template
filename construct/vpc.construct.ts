import { IpAddresses, SubnetType, Vpc, VpcProps } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

type PublicVpcConstructProps = VpcProps & {
  cidrBlock: string;
};

export class PublicVpcConstruct extends Vpc {
  constructor(scope: Construct, id: string, props: PublicVpcConstructProps) {
    const { cidrBlock, ...rest } = props;
    const config: VpcProps = {
      vpcName: id,
      ipAddresses: IpAddresses.cidr(cidrBlock),
      maxAzs: 2,
      natGateways: 1,
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
      ...rest,
    };

    super(scope, id, config);
  }
}
