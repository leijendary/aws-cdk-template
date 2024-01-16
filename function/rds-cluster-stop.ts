import { RDSClient, StopDBClusterCommand, StopDBClusterCommandInput } from "@aws-sdk/client-rds";
import { Handler } from "aws-lambda";

const client = new RDSClient();
const identifier = process.env.IDENTIFIER!!;

export const handler: Handler = async () => {
  console.log("Stopping", identifier);

  const input: StopDBClusterCommandInput = {
    DBClusterIdentifier: process.env.IDENTIFIER!!,
  };
  const command = new StopDBClusterCommand(input);
  const response = await client.send(command);

  console.log("Triggered stop commmand to", response.DBCluster?.DBClusterIdentifier);
};
