import { Handler } from "aws-lambda";
import { BskyAgent } from "@atproto/api";
import { formRecordPayload, searchForPost } from "./utils";
import {
  BlueskyAgentManager,
  generateTaggedUrl,
  SessionData,
} from "@bluniversal-comments/core/utils";

interface PostCreatorProps {
  url: string;
  title: string;
  sessionData: SessionData;
}

const isPayload = (data: any): data is PostCreatorProps => {
  return (
    typeof data === "object" &&
    typeof data.url === "string" &&
    typeof data.title === "string" &&
    typeof data.sessionData === "object" &&
    typeof data.sessionData.accessJwt === "string" &&
    typeof data.sessionData.refreshJwt === "string" &&
    typeof data.sessionData.handle === "string" &&
    typeof data.sessionData.did === "string" &&
    typeof data.sessionData.active === "boolean"
  );
};

export const handler: Handler = async (event) => {
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

    const { url, title, sessionData } = body;

    // Step 1: Ensure the post does not already exist
    const hashedTag = await generateTaggedUrl(url);
    const existingPostUri = await searchForPost(hashedTag);

    if (existingPostUri) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Post already exists" }),
      };
    }

    // Step 2: Validate the user's accessJwt
    const agentManager = new BlueskyAgentManager();
    const isValidToken = await agentManager.validateUserSession(sessionData);

    if (!isValidToken) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid or expired user token." }),
      };
    }

    // Step 3: Use bot credentials to create the post
    const botAgent = new BskyAgent({
      service: "https://bsky.social",
    });

    await botAgent.login({
      identifier: username,
      password: password,
    });

    const did = botAgent?.did;

    if (!did) {
      throw new Error("Failed to retrieve DID from Bluesky.");
    }

    const recordPayload = await formRecordPayload(url, title);
    const { uri } = await botAgent.post({
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
