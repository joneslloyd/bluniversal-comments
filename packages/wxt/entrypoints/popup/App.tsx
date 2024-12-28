import React, { useEffect, useState } from "react";
import { createNewPost, maybeInitializeDevModeAgent } from "../utils";
import { searchForPost } from "../../../functions/src/utils";
import BskyComments from "./BskyComments";
import { generateTaggedUrl } from "@bluniversal-comments/core/utils";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import { useTranslation } from "react-i18next";
import "./App.css";

interface TabInfo {
  url: string;
  title: string;
}

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [postUri, setPostUri] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creatingPost, setCreatingPost] = useState<boolean>(false);
  const agentManager = new BlueskyAgentManager();

  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages[0];
    const languageCode = browserLanguage ? browserLanguage.split("-")[0] : "en";
    console.log({ languageCode });
    i18n.changeLanguage(languageCode);
  }, []);

  useEffect(() => {
    maybeInitializeDevModeAgent(agentManager);
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab.url && !isValidUrl(tab.url)) {
        setErrorMessage(t("page_not_supported_for_bluesky_comments"));
        return;
      }
      setTabInfo({
        url: tab.url || "",
        title: tab.title || "",
      });
    });
  }, []);

  useEffect(() => {
    const initializePost = async () => {
      if (!tabInfo || creatingPost) return;
      try {
        setCreatingPost(true);

        const isLoggedIn = await agentManager.isLoggedIn();
        if (!isLoggedIn) {
          setErrorMessage(
            t(
              "Please go to the options page and enter your Bluesky username and password.",
            ),
          );
          return;
        }

        const { url, title } = tabInfo;

        const normalizedUrl = normalizeUrl(url);
        const hashedTag = await generateTaggedUrl(normalizedUrl);

        setStatusMessage(t("searching_for_existing_posts"));
        let existingPostUri = await searchForPost(hashedTag);
        if (!existingPostUri) {
          setStatusMessage(t("no_existing_post_found_creating_new_post"));
          const sessionData = await agentManager.getSessionFromStorage();
          if (sessionData) {
            existingPostUri = await createNewPost(
              normalizedUrl,
              title,
              sessionData,
            );
          } else {
            console.error("Failed to retrieve session data from storage.");
            setErrorMessage(t("failed_to_initialize_post_try_again"));
          }
        }
        setPostUri(existingPostUri);
        setStatusMessage("");
      } catch (error) {
        console.error("Error during post initialization:", error);
        setErrorMessage(t("failed_to_initialize_post_try_again"));
      } finally {
        setCreatingPost(false);
      }
    };

    initializePost();
  }, [tabInfo]);

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

function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol !== "about:" &&
      parsedUrl.protocol !== "chrome-extension:" &&
      !parsedUrl.hostname.includes("localhost") &&
      !parsedUrl.hostname.includes("newtab")
    );
  } catch {
    return false;
  }
}

export default App;
