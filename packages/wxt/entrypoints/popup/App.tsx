import React, { useEffect, useState, useCallback, useMemo } from "react";
import BskyCommentsContainer from "./BskyCommentsContainer";
import ModalContainer from "./ModalContainer";
import SharePromptModal from "./SharePromptModal";
import Spinner from "./Spinner";
import TabInfoContainer from "./TabInfoContainer";
import PostInitialisationContainer from "./PostInitialisationContainer";
import DevModeAgentContainer from "./DevModeAgentContainer";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import { useTranslation } from "react-i18next";
import { StatusState, TabInfo } from "../types";
import "./App.css";

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null);
  const [postUri, setPostUri] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusState>({
    type: "info",
    message: "",
    isLoading: false,
  });

  const agentManager = useMemo(() => new BlueskyAgentManager(), []);

  const pageNotSupportedMessage = useMemo(
    () => t("page_not_supported_for_bluesky_comments"),
    [t],
  );
  const notLoggedInPleaseLogInMessage = useMemo(
    () => t("not_logged_in_please_log_in"),
    [t],
  );
  const searchingForExistingPostsMessage = useMemo(
    () => t("searching_for_existing_posts"),
    [t],
  );
  const noExistingPostFoundCreatingNewMessage = useMemo(
    () => t("no_existing_post_found_creating_new_post"),
    [t],
  );
  const failedToInitializePostTryAgainMessage = useMemo(
    () => t("failed_to_initialize_post_try_again"),
    [t],
  );

  const shareExperienceTitleMessage = useMemo(
    () => t("share_experience_title"),
    [t],
  );
  const dismissMessage = useMemo(() => t("dismiss"), [t]);
  const sendMessage = useMemo(() => t("send"), [t]);
  const defaultPostContentMessage = useMemo(
    () => t("default_post_content"),
    [t],
  );

  useEffect(() => {
    const initializeAgentManager = async () => {
      await agentManager.initialize();
    };
    initializeAgentManager();
  }, [agentManager]);

  const handleTabInfoChange = useCallback(
    (tabInfo: TabInfo | null, errorMessage: string | null) => {
      if (errorMessage) {
        setStatus({
          type: "error",
          message: errorMessage,
          isLoading: false,
        });
      } else {
        setTabInfo(tabInfo);
      }
    },
    [],
  );

  const handlePostUriChange = useCallback((newPostUri: string | null) => {
    setPostUri(newPostUri);
  }, []);

  const handleStatusChange = useCallback((newStatus: StatusState) => {
    setStatus(newStatus);
  }, []);

  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages[0];
    const languageCode = browserLanguage ? browserLanguage.split("-")[0] : "en";
    i18n.changeLanguage(languageCode);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        margin: "10px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {status.type === "error" ? (
        <p style={{ color: "red" }}>{status.message}</p>
      ) : (
        <>
          <div id="status-container">
            <p>{status.message}</p>
          </div>
          {postUri && (
            <BskyCommentsContainer
              postUri={postUri}
              agentManager={agentManager}
            />
          )}
        </>
      )}
      <TabInfoContainer
        onTabInfoChange={handleTabInfoChange}
        pageNotSupportedMessage={pageNotSupportedMessage}
      />
      <PostInitialisationContainer
        messages={{
          notLoggedInPleaseLogInMessage,
          searchingForExistingPostsMessage,
          noExistingPostFoundCreatingNewMessage,
          failedToInitializePostTryAgainMessage,
        }}
        tabInfo={tabInfo}
        onPostUriChange={handlePostUriChange}
        onStatusChange={handleStatusChange}
        Spinner={Spinner}
        agentManager={agentManager}
      />
      <DevModeAgentContainer agentManager={agentManager} />
      <ModalContainer>
        <SharePromptModal
          messages={{
            defaultPostContentMessage,
            shareExperienceTitleMessage,
            dismissMessage,
            sendMessage,
          }}
        />
      </ModalContainer>
    </div>
  );
};

export default App;
