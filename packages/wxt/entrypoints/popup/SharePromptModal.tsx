import React, { useState } from "react";

interface SharePromptModalProps {
  onClose?: () => void | undefined;
  onSend?: () => void | undefined;
  messages: {
    defaultPostContentMessage: string;
    shareExperienceTitleMessage: string;
    dismissMessage: string;
    sendMessage: string;
  };
}

const SharePromptModal: React.FC<SharePromptModalProps> = ({
  onClose,
  onSend,
  messages,
}) => {
  const {
    defaultPostContentMessage,
    shareExperienceTitleMessage,
    dismissMessage,
    sendMessage,
  } = messages;

  const [postContent, setPostContent] = useState(defaultPostContentMessage);

  const handleSend = () => {
    onSend && onSend();
    const encodedContent = encodeURIComponent(postContent);
    const composeUrl = `https://bsky.app/intent/compose?text=${encodedContent}`;
    window.open(composeUrl, "_blank");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          width: "80%",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <h2>{shareExperienceTitleMessage}</h2>
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          style={{
            width: "100%",
            height: "100px",
            marginBottom: "10px",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#1a73e8",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          {sendMessage}
        </button>
        <button
          onClick={onClose}
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#ccc",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {dismissMessage}
        </button>
      </div>
    </div>
  );
};

export default SharePromptModal;
