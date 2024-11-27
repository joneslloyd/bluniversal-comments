import * as fs from "fs";

export const generateTaggedUrl = async (pageUrl: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pageUrl);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const tag = `bluniversal-${hashHex.slice(0, 43)}`;
  return tag;
};

export const updateEnvFile = (envFilePath: string, apiUrl: string) => {
  try {
    let envContent = "";
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, "utf-8");
    }
    const updatedContent = envContent
      .split("\n")
      .filter((line) => !line.startsWith("WXT_LAMBDA_URL="))
      .join("\n");

    const newEntry = `WXT_LAMBDA_URL=${apiUrl}`;
    const finalContent = updatedContent.trim()
      ? `${updatedContent}\n${newEntry}`
      : newEntry;
    fs.writeFileSync(envFilePath, finalContent, "utf-8");

    console.log(`.env file updated successfully with WXT_LAMBDA_URL=${apiUrl}`);
  } catch (error) {
    console.error("Error updating .env file:", error);
  }
};

import { BskyAgent } from "@atproto/api";

interface SessionData {
  blueskyAccessJwt: string;
  blueskyRefreshJwt: string;
  blueskyHandle: string;
  blueskyDid: string;
  blueskyActive: boolean;
}

export class BlueskyAgentManager {
  private agent: BskyAgent;

  constructor() {
    this.agent = new BskyAgent({ service: "https://bsky.social" });
  }

  async initialize(): Promise<void> {
    const session = await this.getSessionFromStorage();
    if (session) {
      await this.agent.resumeSession({
        accessJwt: session.blueskyAccessJwt,
        refreshJwt: session.blueskyRefreshJwt,
        handle: session.blueskyHandle,
        did: session.blueskyDid,
        active: session.blueskyActive,
      });
    }
  }

  async getAgent(): Promise<BskyAgent> {
    if (!this.agent.session) {
      await this.initialize();
    }
    return this.agent;
  }

  async refreshSession(): Promise<void> {
    const refreshJwt = this.agent.session?.refreshJwt;
    if (!refreshJwt) {
      throw new Error("No refresh token available to refresh the session.");
    }

    try {
      const refreshedSession =
        await this.agent.com.atproto.server.refreshSession(undefined, {
          headers: {
            Authorization: `Bearer ${refreshJwt}`,
          },
        });

      // Save refreshed session to Chrome storage
      this.saveSessionToStorage({
        blueskyAccessJwt: refreshedSession.data.accessJwt,
        blueskyRefreshJwt: refreshedSession.data.refreshJwt,
        blueskyHandle: refreshedSession.data.handle,
        blueskyDid: refreshedSession.data.did,
        blueskyActive: true,
      });

      // Update the agent's session
      await this.agent.resumeSession({
        accessJwt: refreshedSession.data.accessJwt,
        refreshJwt: refreshedSession.data.refreshJwt,
        handle: refreshedSession.data.handle,
        did: refreshedSession.data.did,
        active: true,
      });
    } catch (error) {
      console.error("Failed to refresh session:", error);
      throw new Error("Session refresh failed.");
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.agent.login({ identifier: username, password });
    const session = this.agent.session!;
    this.saveSessionToStorage({
      blueskyAccessJwt: session.accessJwt,
      blueskyRefreshJwt: session.refreshJwt,
      blueskyHandle: session.handle,
      blueskyDid: session.did,
      blueskyActive: true,
    });
  }

  async logout(): Promise<void> {
    await this.agent.logout();
    this.agent.sessionManager.logout();
    this.destroySessionFromStorage();
  }

  private async getSessionFromStorage(): Promise<SessionData | null> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        [
          "blueskyAccessJwt",
          "blueskyRefreshJwt",
          "blueskyHandle",
          "blueskyDid",
          "blueskyActive",
        ],
        (items) => {
          if (
            items.blueskyAccessJwt &&
            items.blueskyRefreshJwt &&
            items.blueskyHandle &&
            items.blueskyDid
          ) {
            resolve(items as SessionData);
          } else {
            resolve(null);
          }
        },
      );
    });
  }

  private saveSessionToStorage(session: SessionData): void {
    chrome.storage.sync.set(session);
  }

  private destroySessionFromStorage(): void {
    chrome.storage.sync.remove([
      "blueskyAccessJwt",
      "blueskyRefreshJwt",
      "blueskyHandle",
      "blueskyDid",
      "blueskyActive",
    ]);
  }
}
