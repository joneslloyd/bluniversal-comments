import React, { useEffect, useState } from "react";
import {
  BlueskyAgentManager,
  generateTaggedUrl,
} from "@bluniversal-comments/core/utils";
import { searchForPost } from "../../../functions/src/utils";
import { createNewPost, normalizeUrl, PostStorage } from "../utils";
import { StatusState, TabInfo } from "../types";

interface PostInitialisationContainerProps {
  tabInfo: TabInfo | null;
  messages: {
    notLoggedInPleaseLogInMessage: string;
    searchingForExistingPostsMessage: string;
    noExistingPostFoundCreatingNewMessage: string;
    failedToInitializePostTryAgainMessage: string;
  };
  onPostUriChange: (postUri: string | null) => void;
  onStatusChange: (status: StatusState) => void;
  Spinner: React.FC<{ show: boolean; loadingText: string }>;
  agentManager: BlueskyAgentManager;
}

const PostInitialisationContainer: React.FC<
  PostInitialisationContainerProps
> = ({
  tabInfo,
  messages,
  onPostUriChange,
  onStatusChange,
  Spinner,
  agentManager,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const {
    notLoggedInPleaseLogInMessage,
    searchingForExistingPostsMessage,
    noExistingPostFoundCreatingNewMessage,
    failedToInitializePostTryAgainMessage,
  } = messages;

  useEffect(() => {
    const checkLoggedIn = async () => {
      const isLoggedIn = await agentManager.isLoggedIn();
      setIsLoggedIn(isLoggedIn);
    };
    checkLoggedIn();
  }, [agentManager]);

  useEffect(() => {
    const initializePost = async () => {
      if (!tabInfo) return;

      const normalizedUrl = normalizeUrl(tabInfo.url);

      const storedPostUri = await PostStorage.getPostUriForUrl(normalizedUrl);
      if (storedPostUri) {
        onPostUriChange(storedPostUri);
        onStatusChange({
          type: "info",
          message: "",
          isLoading: false,
        });
        return;
      }

      onStatusChange({
        type: "loading",
        message: searchingForExistingPostsMessage,
        isLoading: true,
      });

      try {
        if (!isLoggedIn) {
          onStatusChange({
            type: "error",
            message: notLoggedInPleaseLogInMessage,
            isLoading: false,
          });
          return;
        }

        const hashedTag = await generateTaggedUrl(normalizedUrl);
        const existingPostUri = await searchForPost(hashedTag);

        if (existingPostUri) {
          await PostStorage.setPostUriForUrl(normalizedUrl, existingPostUri);
          onPostUriChange(existingPostUri);
          onStatusChange({
            type: "info",
            message: "",
            isLoading: false,
          });
          return;
        }

        onStatusChange({
          type: "loading",
          message: noExistingPostFoundCreatingNewMessage,
          isLoading: true,
        });

        const sessionData = await agentManager.getSessionFromStorage();
        if (sessionData) {
          setShowSpinner(true);
          const newPostPromise = createNewPost(
            normalizedUrl,
            tabInfo.title,
            sessionData,
          );

          const waitPromise = new Promise<void>((resolve) =>
            setTimeout(resolve, 3000),
          );
          const [newPostUri] = await Promise.all([
            newPostPromise,
            waitPromise,
          ] as [Promise<string>, Promise<void>]);
          setShowSpinner(false);

          if (newPostUri) {
            await PostStorage.setPostUriForUrl(normalizedUrl, newPostUri);
            onPostUriChange(newPostUri);
            onStatusChange({
              type: "info",
              message: "",
              isLoading: false,
            });
          } else {
            throw new Error("Failed to create post.");
          }
        }
      } catch (error) {
        console.error("Error during post initialization:", error);
        setShowSpinner(false);
        onStatusChange({
          type: "error",
          message: failedToInitializePostTryAgainMessage,
          isLoading: false,
        });
      }
    };

    initializePost();
  }, [tabInfo, onPostUriChange, onStatusChange, isLoggedIn]);

  return (
    <>{showSpinner && <Spinner show={true} loadingText="Creating post..." />}</>
  );
};

export default PostInitialisationContainer;
