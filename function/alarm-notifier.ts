import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log("Event", event);

  const alarmName = event["alarmData"]["alarmName"];
  const state = event["alarmData"]["state"];
  const reason = state["reason"];
  const reasonData = JSON.parse(state["reasonData"]);
  const startDate = reasonData["startDate"];
  const timestamp = state["timestamp"];
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_TOKEN!!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: process.env.SLACK_CHANNEL!!,
      text: `*Alarm*: ${alarmName}.\n*Reason*: ${reason}\n*Timestamp*: Between ${startDate} and ${timestamp}.`,
    }),
  };

  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", options);
    const json = await response.json();

    console.log("Response", json);
  } catch (error) {
    console.error(error);
  }
};
