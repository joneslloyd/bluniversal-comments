import React, { useEffect, useState } from "react";
import { createNewPost, searchForPost, refreshAccessToken } from "./utils";
import BskyComments from "./BskyComments";
import "./App.css";
import { generateTaggedUrl } from "@bluniversal-comments/core/utils";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";

interface TabInfo {
  url: string;
  title: string;
}

const App: React.FC = () => {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [postUri, setPostUri] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const agentManager = new BlueskyAgentManager();

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      setTabInfo({
        url: tab.url || "",
        title: tab.title || "",
      });
    });
  }, []);

  useEffect(() => {
    const initializePost = async () => {
      if (!tabInfo) return;
      agentManager.initialize();
      const { url, title } = tabInfo;

      const normalizedUrl = normalizeUrl(url);
      const hashedTag = await generateTaggedUrl(normalizedUrl);

       setStatusMessage("Searching for existing posts...");
            let existingPostUri = await searchForPost(hashedTag);
            if (!existingPostUri) {
              setStatusMessage(
                "No existing post found. Creating a new post...",
              );
              existingPostUri = await createNewPost(normalizedUrl, title);
            }
            setPostUri(existingPostUri);
            setStatusMessage("");
    };

    initializePost();
  }, [tabInfo, postUri]);

  return (
    <div style={{ padding: "10px", fontFamily: "Arial, sans-serif" }}>
      {errorMessage ? (
        <p style={{ color: "red" }}>{errorMessage}</p>
      ) : (
        <>
          <div id="status-container">
            <p>{statusMessage}</p>
          </div>
          {postUri && (
            <div id="comments-container">
              <BskyComments postUri={postUri} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.hostname = parsedUrl.hostname.replace(/^www\./, "");
    parsedUrl.hash = "";
    const paramsToRemove = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];
    paramsToRemove.forEach((param) => parsedUrl.searchParams.delete(param));
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "");
    return parsedUrl.toString().toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export default App;
