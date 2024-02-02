import { EC2Client, StopInstancesCommand, StopInstancesCommandInput } from "@aws-sdk/client-ec2";
import { Handler } from "aws-lambda";

const client = new EC2Client();
const instanceId = process.env.INSTANCE_ID!!;

export const handler: Handler = async () => {
  console.log("Stopping", instanceId);

  const input: StopInstancesCommandInput = {
    InstanceIds: [instanceId],
  };
  const command = new StopInstancesCommand(input);
  const response = await client.send(command);

  console.log("Triggered stop command to", response.StoppingInstances?.[0].InstanceId);
};
