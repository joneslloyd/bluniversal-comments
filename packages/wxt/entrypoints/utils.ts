import {
  BlueskyAgentManager,
  SessionData,
} from "@bluniversal-comments/core/utils";

export async function createNewPost(
  pageUrl: string,
  pageTitle: string,
  sessionData: SessionData,
): Promise<string> {
  const agentManager = new BlueskyAgentManager();
  const agent = await agentManager.getAgent();

  if (!agent.session?.accessJwt) {
    throw new Error("Session expired.");
  }

  const payload = {
    url: pageUrl,
    title: pageTitle,
    sessionData,
  };

  const lambdaUrl = import.meta.env.WXT_LAMBDA_URL;

  const response = await fetch(lambdaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.statusText}`);
  }

  const data = await response.json();

  // Return the URI of the newly created post
  return data.uri;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<string> {
  const response = await fetch(
    "https://bsky.social/xrpc/com.atproto.server.refreshSession",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }
  const data = await response.json();
  chrome.storage.sync.set({
    blueskyAccessJwt: data.accessJwt,
    blueskyRefreshJwt: data.refreshJwt,
    blueskyDid: data.did,
    blueskyHandle: data.handle,
    blueskyActive: data.active,
  });
  return data.accessJwt;
}

export const maybeInitializeDevModeAgent = async (agentManager: BlueskyAgentManager) => {
  const devUsername = import.meta.env.WXT_BS_DEV_USERNAME;
  const devPassword = import.meta.env.WXT_BS_DEV_PASSWORD;

  if (devUsername && devPassword) {
    await agentManager.login(devUsername, devPassword);
    await agentManager.initialize();
  }
};

export default maybeInitializeDevModeAgent;