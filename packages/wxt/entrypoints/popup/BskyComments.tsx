import React, { useState } from "react";
import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import BskyReply from "./BskyReply";
import "./BskyComments.css";

interface BskyCommentsProps {
  postUri: string;
  isLoggedIn: boolean;
  error: string | null;
  replies: AppBskyFeedDefs.ThreadViewPost[] | null;
  rootData: { uri: string; cid: string } | null;
  onFetchReplies: (depth?: number) => Promise<void>;
  messages: {
    notLoggedInPleaseLogInMessage: string;
    openOptionsPageMessage: string;
    likesMessage: string;
    repliesMessage: string;
    showMoreCommentsMessage: string;
    noCommentsYetStartDiscussionMessage: string;
    loadingCommentsMessage: string;
  };
}

const BskyComments: React.FC<BskyCommentsProps> = ({
  postUri,
  isLoggedIn,
  error,
  replies,
  rootData,
  onFetchReplies,
  messages,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(3);

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
          {messages.notLoggedInPleaseLogInMessage}{" "}
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
          onClick={() => browser.runtime.openOptionsPage()}
        >
          {messages.openOptionsPageMessage}
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
          {post.likeCount ?? 0} {messages.likesMessage} • {post.replyCount ?? 0}{" "}
          {messages.repliesMessage}
        </p>
        <BskyReply
          parentUri={post.uri}
          rootData={rootData || { uri: postUri, cid: "" }}
          onReplySuccess={onFetchReplies}
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
                  {messages.showMoreCommentsMessage}
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
              {messages.noCommentsYetStartDiscussionMessage}{" "}
            </p>
          )}
          {rootData && (
            <BskyReply
              parentUri={postUri}
              rootData={rootData}
              onReplySuccess={onFetchReplies}
            />
          )}
        </div>
      ) : (
        <p>{messages.loadingCommentsMessage}</p>
      )}
    </div>
  );
};

export default BskyComments;
