import React, { useState } from "react";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import "./BskyReply.css";

interface BskyReplyProps {
  parentUri: string;
  rootData: {
    uri: string;
    cid: string;
  };
  onReplySuccess: () => Promise<void>;
}

const BskyReply: React.FC<BskyReplyProps> = ({
  parentUri,
  rootData,
  onReplySuccess,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const agentManager = new BlueskyAgentManager();

  const handleReply = async () => {
    if (!replyText.trim()) {
      setError("Reply text cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const agent = await agentManager.getAgent();
      await agent.post({
        $type: "app.bsky.feed.post",
        text: replyText,
        reply: {
          root: {
            uri: rootData.uri,
            cid: rootData.cid,
          },
          parent: {
            uri: parentUri,
            cid: rootData.cid,
          },
        },
        createdAt: new Date().toISOString(),
      });

      setReplyText("");
      setIsReplying(false);
      await onReplySuccess();
    } catch (err) {
      console.error("Failed to post reply:", err);
      setError("Failed to post reply. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="reply-container"
      style={{ marginTop: "10px", textAlign: "left" }}
    >
      {isReplying ? (
        <div>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "5px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
          <div>
            <button
              onClick={handleReply}
              disabled={isLoading}
              style={{
                padding: "8px 12px",
                backgroundColor: "#1a73e8",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "5px",
              }}
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => setIsReplying(false)}
              style={{
                padding: "8px 12px",
                backgroundColor: "#ccc",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      ) : (
        <button
          onClick={() => setIsReplying(true)}
          style={{
            padding: "8px 12px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reply
        </button>
      )}
    </div>
  );
};

export default BskyReply;
