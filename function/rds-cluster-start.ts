import { RDSClient, StartDBClusterCommand, StartDBClusterCommandInput } from "@aws-sdk/client-rds";
import { Handler } from "aws-lambda";

const client = new RDSClient();
const identifier = process.env.IDENTIFIER!!;

export const handler: Handler = async () => {
  console.log("Starting", identifier);

  const input: StartDBClusterCommandInput = {
    DBClusterIdentifier: process.env.IDENTIFIER!!,
  };
  const command = new StartDBClusterCommand(input);
  const response = await client.send(command);

  console.log("Triggered start commmand to", response.DBCluster?.DBClusterIdentifier);
};
