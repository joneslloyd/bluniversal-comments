import React, { useEffect, useState, useMemo } from "react";
import { AppBskyFeedDefs } from "@atproto/api";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import BskyComments from "./BskyComments";
import { useTranslation } from "react-i18next";

interface BskyCommentsContainerProps {
  postUri: string;
  agentManager: BlueskyAgentManager;
}

const BskyCommentsContainer: React.FC<BskyCommentsContainerProps> = ({
  postUri,
  agentManager,
}) => {
  const { t } = useTranslation();

  const threadNotFoundOrAccessBlockedMessage = useMemo(
    () => t("thread_not_found_or_access_blocked"),
    [t],
  );

  const failedToLoadCommentsMessage = useMemo(
    () => t("failed_to_load_comments"),
    [t],
  );

  const notLoggedInPleaseLogInMessage = useMemo(
    () => t("not_logged_in_please_log_in"),
    [t],
  );

  const openOptionsPageMessage = useMemo(() => t("open_options_page"), [t]);

  const likesMessage = useMemo(() => t("likes"), [t]);

  const repliesMessage = useMemo(() => t("replies"), [t]);

  const showMoreCommentsMessage = useMemo(() => t("show_more_comments"), [t]);

  const noCommentsYetStartDiscussionMessage = useMemo(
    () => t("no_comments_yet_start_discussion"),
    [t],
  );

  const loadingCommentsMessage = useMemo(() => t("loading_comments"), [t]);

  const [replies, setReplies] = useState<
    AppBskyFeedDefs.ThreadViewPost[] | null
  >(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rootData, setRootData] = useState<{
    uri: string;
    cid: string;
  } | null>(null);

  const fetchReplies = async (depth: number = 3) => {
    try {
      const agent = await agentManager.getAgent();
      const response = await agent.getPostThread({ uri: postUri, depth });

      if (AppBskyFeedDefs.isThreadViewPost(response.data.thread)) {
        const thread = response.data.thread;

        if (thread.replies) {
          const topLevelReplies = thread.replies.filter((reply) =>
            AppBskyFeedDefs.isThreadViewPost(reply),
          ) as AppBskyFeedDefs.ThreadViewPost[];
          setReplies(topLevelReplies);
        } else {
          setReplies([]);
        }

        if (thread.post.cid) {
          setRootData({ uri: thread.post.uri, cid: thread.post.cid });
        }
      } else {
        setError(threadNotFoundOrAccessBlockedMessage);
      }
    } catch (err) {
      console.error("Failed to load replies:", err);
      setError(failedToLoadCommentsMessage);
    }
  };

  useEffect(() => {
    const checkLoggedIn = async () => {
      const isLoggedIn = await agentManager.isLoggedIn();
      setIsLoggedIn(isLoggedIn);
    };
    checkLoggedIn();
  }, [agentManager]);

  useEffect(() => {
    const fetchAndSetReplies = async () => {
      if (isLoggedIn) {
        fetchReplies();
      }
    };

    fetchAndSetReplies();

    const intervalId = setInterval(() => {
      fetchAndSetReplies();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [postUri, isLoggedIn]);

  return (
    <BskyComments
      isLoggedIn={isLoggedIn}
      error={error}
      replies={replies}
      rootData={rootData}
      onFetchReplies={fetchReplies}
      postUri={postUri}
      messages={{
        notLoggedInPleaseLogInMessage,
        openOptionsPageMessage,
        likesMessage,
        repliesMessage,
        showMoreCommentsMessage,
        noCommentsYetStartDiscussionMessage,
        loadingCommentsMessage,
      }}
    />
  );
};

export default BskyCommentsContainer;
