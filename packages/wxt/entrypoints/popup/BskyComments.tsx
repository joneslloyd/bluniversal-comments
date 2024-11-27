import React, { useEffect, useState } from "react";
import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import BskyReply from "./BskyReply";
import "./BskyComments.css";

interface BskyCommentsProps {
  postUri: string;
}

const BskyComments: React.FC<BskyCommentsProps> = ({ postUri }) => {
  const [replies, setReplies] = useState<
    AppBskyFeedDefs.ThreadViewPost[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [rootData, setRootData] = useState<{
    uri: string;
    cid: string;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const agentManager = new BlueskyAgentManager();

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
        setError("Thread not found or access blocked.");
      }
    } catch (err) {
      console.error("Failed to load replies:", err);
      setError("Failed to load comments.");
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const isInitialized = await agentManager.initialize();
        setIsLoggedIn(isInitialized);

        if (isInitialized) {
          await fetchReplies();
        }
      } catch {
        setIsLoggedIn(false);
      }
    };

    initialize();

    const intervalId = setInterval(() => {
      if (isLoggedIn) {
        fetchReplies();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [postUri, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          padding: "10px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "red", fontSize: "14px" }}>
          You are not logged in. Please go to the options page to log in.
        </p>
        <button
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Open Options Page
        </button>
      </div>
    );
  }

  const renderReply = (reply: AppBskyFeedDefs.ThreadViewPost) => {
    const { post } = reply;
    const record = post.record as AppBskyFeedPost.Record;
    const userLocale = navigator.language || "en-GB";

    const formattedDate = new Date(record.createdAt).toLocaleString(
      userLocale,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    return (
      <div
        key={post.uri}
        className="comment-container"
        style={{
          marginBottom: "15px",
          paddingLeft: "15px",
          borderLeft: "1px solid #ddd",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          {post.author.avatar && (
            <img
              src={post.author.avatar}
              alt={post.author.handle}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                marginRight: "10px",
              }}
            />
          )}
          <div style={{ textAlign: "left" }}>
            <strong style={{ fontSize: "14px" }}>
              {post.author.displayName || post.author.handle}
            </strong>
            <small
              style={{ display: "block", color: "#666", fontSize: "12px" }}
            >
              @{post.author.handle}
            </small>
            <small
              style={{ display: "block", color: "#666", fontSize: "12px" }}
            >
              {formattedDate}
            </small>
          </div>
        </div>
        <p
          style={{
            marginBottom: "10px",
            lineHeight: "1.6",
            textAlign: "left",
            fontSize: "14px",
          }}
        >
          {record.text}
        </p>
        <p style={{ color: "#999", fontSize: "12px", textAlign: "left" }}>
          {post.likeCount ?? 0} likes • {post.replyCount ?? 0} replies
        </p>

        <BskyReply
          parentUri={post.uri}
          rootData={rootData || { uri: postUri, cid: "" }}
          onReplySuccess={fetchReplies}
        />

        {reply.replies &&
          reply.replies.slice(0, visibleCount).map((childReply) => {
            if (AppBskyFeedDefs.isThreadViewPost(childReply)) {
              return renderReply(childReply);
            }
            return null;
          })}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "0" }}>
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : replies ? (
        <div>
          {replies.length > 0 ? (
            <>
              {replies
                .slice(0, visibleCount)
                .map((reply) => renderReply(reply))}
              {replies.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: "#1a73e8",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Show more comments
                </button>
              )}
            </>
          ) : (
            <p
              style={{
                textAlign: "center",
                color: "#666",
                fontSize: "14px",
                marginTop: "20px",
              }}
            >
              No comments yet. Be the first to start the discussion!
            </p>
          )}
          {rootData && (
            <BskyReply
              parentUri={postUri}
              rootData={rootData}
              onReplySuccess={fetchReplies}
            />
          )}
        </div>
      ) : (
        <p>Loading comments...</p>
      )}
    </div>
  );
};

export default BskyComments;
