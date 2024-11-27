import { BskyAgent } from "@atproto/api";
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

export interface SessionData {
  accessJwt: string;
  refreshJwt: string;
  handle: string;
  did: string;
  active: boolean;
}

export class BlueskyAgentManager {
  private agent: BskyAgent;

  constructor() {
    this.agent = new BskyAgent({ service: "https://bsky.social" });
  }

  async initialize(): Promise<boolean> {
    const session = await this.getSessionFromStorage();
    if (session) {
      await this.agent.resumeSession({
        accessJwt: session.accessJwt,
        refreshJwt: session.refreshJwt,
        handle: session.handle,
        did: session.did,
        active: session.active,
      });
      return true;
    }
    return false;
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
        accessJwt: refreshedSession.data.accessJwt,
        refreshJwt: refreshedSession.data.refreshJwt,
        handle: refreshedSession.data.handle,
        did: refreshedSession.data.did,
        active: true,
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

  async validateUserSession(sessionData: {
    accessJwt: string;
    refreshJwt: string;
    handle: string;
    did: string;
    active: boolean;
  }): Promise<boolean> {
    try {
      await this.agent.resumeSession(sessionData);
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);

      if ((error as any).error === "Invalid session") {
        try {
          const refreshedSession =
            await this.agent.com.atproto.server.refreshSession(undefined, {
              headers: { Authorization: `Bearer ${sessionData.refreshJwt}` },
            });

          await this.agent.resumeSession({
            accessJwt: refreshedSession.data.accessJwt,
            refreshJwt: refreshedSession.data.refreshJwt,
            handle: refreshedSession.data.handle,
            did: refreshedSession.data.did,
            active: true,
          });

          return true; // Session is now valid
        } catch (refreshError) {
          console.error("Session refresh failed:", refreshError);
          return false;
        }
      }

      return false;
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.agent.login({ identifier: username, password });
    const session = this.agent.session!;
    this.saveSessionToStorage({
      accessJwt: session.accessJwt,
      refreshJwt: session.refreshJwt,
      handle: session.handle,
      did: session.did,
      active: true,
    });
  }

  async logout(): Promise<void> {
    await this.agent.logout();
    this.agent.sessionManager.logout();
    this.destroySessionFromStorage();
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      // Check if session exists
      const session = await this.getSessionFromStorage();
      if (session) {
        // Validate the session
        return await this.validateUserSession({
          accessJwt: session.accessJwt,
          refreshJwt: session.refreshJwt,
          handle: session.handle,
          did: session.did,
          active: session.active ?? false,
        });
      }
    } catch (error) {
      console.error("isLoggedIn check failed:", error);
    }
    return false; // Not logged in if session is invalid or missing
  }

  public async getSessionFromStorage(): Promise<SessionData | null> {
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
            resolve({
              accessJwt: items.blueskyAccessJwt,
              refreshJwt: items.blueskyRefreshJwt,
              handle: items.blueskyHandle,
              did: items.blueskyDid,
              active: items.blueskyActive,
            });
          } else {
            resolve(null);
          }
        },
      );
    });
  }

  private saveSessionToStorage(session: SessionData): void {
    chrome.storage.sync.set({
      blueskyAccessJwt: session.accessJwt,
      blueskyRefreshJwt: session.refreshJwt,
      blueskyHandle: session.handle,
      blueskyDid: session.did,
      blueskyActive: session.active,
    });
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
