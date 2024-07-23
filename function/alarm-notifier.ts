import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log(event);

  const alarmName = event["alarmData"]["alarmName"];
  const state = event["alarmData"]["state"];
  const reason = state["reason"];
  const reasonData = JSON.parse(state["reasonData"]);
  const queryDate = reasonData["queryDate"];
  const timestamp = state["timestamp"];
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_TOKEN!!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: process.env.SLACK_CHANNEL!!,
      text: `*Alarm*: ${alarmName}.\n*Reason*: ${reason}\n*Timestamp*: Between ${queryDate} and ${timestamp}.`,
    }),
  };

  fetch("https://slack.com/api/chat.postMessage", options)
    .then((response) => response.text())
    .then(console.log)
    .catch(console.error);
};
