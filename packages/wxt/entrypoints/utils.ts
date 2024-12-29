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
  browser.storage.sync.set({
    blueskyAccessJwt: data.accessJwt,
    blueskyRefreshJwt: data.refreshJwt,
    blueskyDid: data.did,
    blueskyHandle: data.handle,
    blueskyActive: data.active,
  });
  return data.accessJwt;
}

export const getBrowserType = (): string => {
  const userAgent = navigator.userAgent;
  let browserType = "Unknown";

  if (userAgent.includes("Chrome")) {
    browserType = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browserType = "Firefox";
  } else if (userAgent.includes("Safari")) {
    browserType = "Safari";
  } else if (userAgent.includes("Edge")) {
    browserType = "Edge";
  } else if (userAgent.includes("Opera")) {
    browserType = "Opera";
  }

  return browserType;
};

export const normalizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.hostname = parsedUrl.hostname.replace(/^www\./, "");
    parsedUrl.hash = "";
    parsedUrl.search = "";
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "");
    return parsedUrl.toString().toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

export class PostStorage {
  private static readonly MASTER_KEY = "bluniversalComments:Posts";

  static async getPostUriForUrl(url: string): Promise<string | null> {
    const storedData = await browser.storage.local.get(this.MASTER_KEY);
    const posts = storedData[this.MASTER_KEY] || {};
    return posts[url] || null;
  }

  static async setPostUriForUrl(url: string, postUri: string): Promise<void> {
    const storedData = await browser.storage.local.get(this.MASTER_KEY);
    const posts = storedData[this.MASTER_KEY] || {};
    posts[url] = postUri;
    await browser.storage.local.set({ [this.MASTER_KEY]: posts });
  }
}

export const maybeInitializeDevModeAgent = async (
  agentManager: BlueskyAgentManager,
) => {
  const devUsername = import.meta.env.WXT_BS_DEV_USERNAME?.trim();
  const devPassword = import.meta.env.WXT_BS_DEV_PASSWORD?.trim();

  if (devUsername && devPassword) {
    await agentManager.login(devUsername, devPassword);
    await agentManager.initialize();
  }
};

export default maybeInitializeDevModeAgent;
