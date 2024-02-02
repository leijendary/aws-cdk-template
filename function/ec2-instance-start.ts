import { EC2Client, StartInstancesCommand, StartInstancesCommandInput } from "@aws-sdk/client-ec2";
import { Handler } from "aws-lambda";

const client = new EC2Client();
const instanceId = process.env.INSTANCE_ID!!;

export const handler: Handler = async () => {
  console.log("Starting", instanceId);

  const input: StartInstancesCommandInput = {
    InstanceIds: [instanceId],
  };
  const command = new StartInstancesCommand(input);
  const response = await client.send(command);

  console.log("Triggered start command to", response.StartingInstances?.[0].InstanceId);
};
