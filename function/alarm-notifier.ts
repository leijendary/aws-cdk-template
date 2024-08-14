import { Handler } from "aws-lambda";

export const handler: Handler = async (event) => {
  console.log("Event", event);

  const alarmName = event["alarmData"]["alarmName"];
  const state = event["alarmData"]["state"];
  const reasonData = JSON.parse(state["reasonData"]);
  const count = parseInt(reasonData["recentDatapoints"][0]);
  const startDate = formatToDate(reasonData["startDate"]);
  const timestamp = formatToDate(state["timestamp"]);
  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SLACK_TOKEN!!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel: process.env.SLACK_CHANNEL_ID!!,
      text: `There were ${count} error(s) from *${alarmName}* between *${startDate}* and *${timestamp}*`,
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

function formatToDate(value: string): string {
  const date = new Date(value);
  const iso = date.toISOString();
  const formatted = iso.replace("T", " ").substring(0, iso.lastIndexOf("."));

  return `${formatted} GMT`;
}
