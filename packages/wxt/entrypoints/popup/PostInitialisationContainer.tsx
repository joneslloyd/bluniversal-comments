import React, { useEffect, useState, useMemo } from "react";
import { generateTaggedUrl } from "@bluniversal-comments/core/utils";
import { searchForPost } from "../../../functions/src/utils";
import { createNewPost, normalizeUrl } from "../utils";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import { StatusState, TabInfo } from "../types";

interface PostInitialisationContainerProps {
  tabInfo: TabInfo | null;
  messages: {
    notLoggedInPleaseLogInMessage: string;
    searchingForExistingPostsMessage: string;
    noExistingPostFoundCreatingNewMessage: string;
    failedToInitializePostTryAgainMessage: string;
  };
  postUri: string | null;
  onPostUriChange: (postUri: string | null) => void;
  onStatusChange: (status: StatusState) => void;
  Spinner: React.FC<{ show: boolean; loadingText: string }>;
}

const PostInitialisationContainer: React.FC<
  PostInitialisationContainerProps
> = ({
  tabInfo,
  messages,
  postUri,
  onPostUriChange,
  onStatusChange,
  Spinner,
}) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const {
    notLoggedInPleaseLogInMessage,
    searchingForExistingPostsMessage,
    noExistingPostFoundCreatingNewMessage,
    failedToInitializePostTryAgainMessage,
  } = messages;

  const agentManager = useMemo(() => new BlueskyAgentManager(), []);

  useEffect(() => {
    const initializePost = async () => {
      if (!tabInfo || postUri) return;

      onStatusChange({
        type: "loading",
        message: searchingForExistingPostsMessage,
        isLoading: true,
      });

      try {
        const isLoggedIn = await agentManager.isLoggedIn();
        if (!isLoggedIn) {
          onStatusChange({
            type: "error",
            message: notLoggedInPleaseLogInMessage,
            isLoading: false,
          });
          return;
        }

        const normalizedUrl = normalizeUrl(tabInfo.url);
        const hashedTag = await generateTaggedUrl(normalizedUrl);

        const existingPostUri = await searchForPost(hashedTag);

        if (existingPostUri) {
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
  }, [tabInfo, postUri, onPostUriChange, onStatusChange, agentManager]);

  return (
    <>{showSpinner && <Spinner show={true} loadingText="Creating post..." />}</>
  );
};

export default PostInitialisationContainer;
