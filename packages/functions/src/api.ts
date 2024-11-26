import { Handler } from "aws-lambda";
import { BskyAgent } from "@atproto/api";
import { formRecordPayload } from "./utils";

interface PostCreatorProps {
  url: string;
  title: string;
}

const isPayload = (data: any): data is PostCreatorProps => {
  return (
    typeof data === "object" &&
    typeof data.url === "string" &&
    typeof data.title === "string"
  );
};

export const handler: Handler<
  {
    body: string;
  },
  {
    statusCode: number;
    body: string;
  }
> = async (event) => {
  const username = process.env.username;
  const password = process.env.password;

  if (!username || !password) {
    throw new Error(
      "Internal Bluniversal Comments error: Missing username or password.",
    );
  }

  try {
    let body: any;

    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON" }),
      };
    }

    if (!isPayload(body)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid payload structure" }),
      };
    }

    const { url, title } = body;

    if (!url || !title) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required parameters: 'url' or 'title'.",
        }),
      };
    }

    const agent = new BskyAgent({
      service: "https://bsky.social",
    });

    await agent.login({
      identifier: username,
      password: password,
    });

    const did = agent?.did;

    if (!did) {
      throw new Error("Failed to retrieve DID from the Bluesky.");
    }

    const recordPayload = await formRecordPayload(url, title);
    const { uri } = await agent.post({
      ...recordPayload,
      createdAt: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ uri }),
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    };
  } catch (error: any) {
    console.error("Error in Lambda function:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error",
        details: error.message || "Unknown error occurred",
      }),
    };
  }
};
