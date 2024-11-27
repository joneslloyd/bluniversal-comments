import { Handler } from "aws-lambda";
import { BskyAgent } from "@atproto/api";
import { formRecordPayload, searchForPost } from "./utils";
import { generateTaggedUrl } from "@bluniversal-comments/core/utils";

interface PostCreatorProps {
  url: string;
  title: string;
  timestamp: number;
  hash: string;
}

const isPayload = (data: any): data is PostCreatorProps => {
  return (
    typeof data === "object" &&
    typeof data.url === "string" &&
    typeof data.title === "string" &&
    typeof data.timestamp === "number" &&
    typeof data.hash === "string"
  );
};

async function generateHash(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

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
      "Internal Bluniversal Comments error: Missing username or password."
    );
  }

  const SHARED_SECRET = process.env.sharedSecret || "";

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

    const { url, title, timestamp, hash } = body;

    const hashedTag = await generateTaggedUrl(url);
    const existingPostUri = await searchForPost(hashedTag);

    if(existingPostUri) {
            return {
        statusCode: 400,
        body: JSON.stringify({ error: "Post already exists" }),
      };
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      // Allow 5 minutes of drift
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Timestamp out of range" }),
      };
    }

    const payload = `${url}|${title}|${timestamp}`;
    const calculatedHash = await generateHash(payload, SHARED_SECRET);

    if (calculatedHash !== hash) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Invalid hash" }),
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
      throw new Error("Failed to retrieve DID from Bluesky.");
    }

    const recordPayload = await formRecordPayload(url, title);
    const { uri } = await agent.post({
      ...recordPayload,
      createdAt: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ uri }),
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
