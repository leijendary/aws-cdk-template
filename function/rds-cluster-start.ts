import { RDSClient, StartDBClusterCommand, StartDBClusterCommandInput } from "@aws-sdk/client-rds";

const client = new RDSClient();
const identifier = process.env.IDENTIFIER!!;

export async function handler() {
  console.log("Starting", identifier);

  const input: StartDBClusterCommandInput = {
    DBClusterIdentifier: process.env.IDENTIFIER!!,
  };
  const command = new StartDBClusterCommand(input);
  const response = await client.send(command);

  console.log("Triggered start command to", response.DBCluster?.DBClusterIdentifier);
}
