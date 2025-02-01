import { RDSClient, StopDBClusterCommand, StopDBClusterCommandInput } from "@aws-sdk/client-rds";

const client = new RDSClient();
const identifier = process.env.IDENTIFIER!!;

export async function handler() {
  console.log("Stopping", identifier);

  const input: StopDBClusterCommandInput = {
    DBClusterIdentifier: process.env.IDENTIFIER!!,
  };
  const command = new StopDBClusterCommand(input);
  const response = await client.send(command);

  console.log("Triggered stop command to", response.DBCluster?.DBClusterIdentifier);
}
