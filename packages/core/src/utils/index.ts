import { BskyAgent } from "@atproto/api";
import { storage } from "@wxt-dev/storage";
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
    console.error(`Error updating file at ${envFilePath}:`, error);
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

  constructor(apiUrl: string = "https://bsky.social") {
    this.agent = new BskyAgent({ service: apiUrl });
  }

  async initialize(): Promise<boolean> {
    const session = await this.getSessionFromStorage();
    if (session) {
      const { accessJwt, refreshJwt, handle, did, active } = session;
      await this.agent.resumeSession({
        accessJwt,
        refreshJwt,
        handle,
        did,
        active,
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

      const {
        data: { accessJwt, refreshJwt: newRefreshJwt, handle, did },
      } = refreshedSession;

      this.saveSessionToStorage({
        accessJwt,
        refreshJwt: newRefreshJwt,
        handle,
        did,
        active: true,
      });

      await this.agent.resumeSession({
        accessJwt,
        refreshJwt: newRefreshJwt,
        handle,
        did,
        active: true,
      });
    } catch (error) {
      console.error("Failed to refresh session:", error);
      throw new Error("Session refresh failed.");
    }
  }

  async validateUserSession(sessionData: SessionData): Promise<boolean> {
    try {
      await this.agent.resumeSession(sessionData);
      return true;
    } catch (error) {
      console.error("Session validation failed:", error);

      if ((error as any).error === "Invalid session") {
        try {
          const { refreshJwt } = sessionData;
          const refreshedSession =
            await this.agent.com.atproto.server.refreshSession(undefined, {
              headers: { Authorization: `Bearer ${refreshJwt}` },
            });

          const {
            data: { accessJwt, refreshJwt: newRefreshJwt, handle, did },
          } = refreshedSession;
          await this.agent.resumeSession({
            accessJwt,
            refreshJwt: newRefreshJwt,
            handle,
            did,
            active: true,
          });

          return true;
        } catch (refreshError) {
          console.error("Session refresh failed:", refreshError);
          return false;
        }
      }

      return false;
    }
  }

  async login(username: string, password: string): Promise<void> {
    const response = await this.agent.login({ identifier: username, password });
    if (!response.success) {
      throw new Error("Login failed.");
    }
    const session = this.agent.session!;
    const { accessJwt, refreshJwt, handle, did } = session;
    this.saveSessionToStorage({
      accessJwt,
      refreshJwt,
      handle,
      did,
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
      const session = await this.getSessionFromStorage();
      if (session) {
        return await this.validateUserSession(session);
      }
    } catch (error) {
      console.error("isLoggedIn check failed:", error);
    }
    return false;
  }

  async getSessionFromStorage(): Promise<SessionData | null> {
    const items = await storage.getItems([
      "sync:blueskyAccessJwt",
      "sync:blueskyRefreshJwt",
      "sync:blueskyHandle",
      "sync:blueskyDid",
      "sync:blueskyActive",
    ]);

    const sessionData: Partial<SessionData> = {};

    items.forEach(({ key, value }) => {
      switch (key) {
        case "sync:blueskyAccessJwt":
          sessionData.accessJwt = value;
          break;
        case "sync:blueskyRefreshJwt":
          sessionData.refreshJwt = value;
          break;
        case "sync:blueskyHandle":
          sessionData.handle = value;
          break;
        case "sync:blueskyDid":
          sessionData.did = value;
          break;
        case "sync:blueskyActive":
          sessionData.active = value;
          break;
      }
    });

    if (
      sessionData.accessJwt &&
      sessionData.refreshJwt &&
      sessionData.handle &&
      sessionData.did
    ) {
      return sessionData as SessionData;
    }

    return null;
  }

  private saveSessionToStorage(session: SessionData): void {
    const { accessJwt, refreshJwt, handle, did, active } = session;
    storage.setItems([
      { key: "sync:blueskyAccessJwt", value: accessJwt },
      { key: "sync:blueskyRefreshJwt", value: refreshJwt },
      { key: "sync:blueskyHandle", value: handle },
      { key: "sync:blueskyDid", value: did },
      { key: "sync:blueskyActive", value: active },
    ]);
  }

  private destroySessionFromStorage(): void {
    storage.removeItems([
      "sync:blueskyAccessJwt",
      "sync:blueskyRefreshJwt",
      "sync:blueskyHandle",
      "sync:blueskyDid",
      "sync:blueskyActive",
    ]);
  }
}
