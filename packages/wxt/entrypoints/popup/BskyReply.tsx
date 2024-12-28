import React, { useState } from "react";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const agentManager = new BlueskyAgentManager();

  const handleReply = async () => {
    if (!replyText.trim()) {
      setError(t("reply_text_cannot_be_empty"));
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
      setError(t("failed_to_post_reply_please_try_again"));
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
            placeholder={t("write_your_reply")}
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
              {isLoading ? t("sending") : t("send")}
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
              {t("cancel")}
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
          {t("reply")}
        </button>
      )}
    </div>
  );
};

export default BskyReply;
