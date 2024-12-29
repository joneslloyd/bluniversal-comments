import React, { useState, useEffect } from "react";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import { maybeInitializeDevModeAgent } from "../utils";
import { useTranslation } from "react-i18next";

const Options: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<
    { type: "error" | "info"; message: string } | undefined
  >(undefined);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const agentManager = new BlueskyAgentManager();

  useEffect(() => {
    const initialize = async () => {
      try {
        await maybeInitializeDevModeAgent(agentManager);
        await checkSessionStatus(t);
      } catch (error) {
        console.error("Error during initialization:", error);
        setStatusMessage({
          type: "error",
          message: t("initialization_failed_please_log_in"),
        });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [t]);

  const checkSessionStatus = async (t: any) => {
    try {
      const agent = await agentManager.getAgent();
      if (agent.session?.accessJwt) {
        setSessionValid(true);
        setUsername(agent.session.handle || "");
        setStatusMessage({
          type: "info",
          message: t("active_session_verified"),
        });
      } else {
        setSessionValid(false);
        setStatusMessage({
          type: "error",
          message: t("no_active_session_found_please_log_in"),
        });
      }
    } catch (error) {
      console.error("Error verifying session:", error);
      setSessionValid(false);
      setStatusMessage({
        type: "error",
        message: t("failed_to_verify_session_please_log_in"),
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage({ type: "info", message: t("logging_in") });
    setLoading(true);

    try {
      await agentManager.logout();
      await agentManager.login(username, password);
      setSessionValid(true);
      setStatusMessage({ type: "info", message: t("logged_in_successfully") });
      setEditing(false);
    } catch (error: any) {
      setSessionValid(false);
      setStatusMessage({
        type: "error",
        message: t("error_logging_in", { error: error.message }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setUsername("");
    setPassword("");
    setSessionValid(null);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>{t("bluniversal_comments_login_to_bluesky")}</h1>

      {loading ? (
        <p>{t("loading")}</p>
      ) : sessionValid ? (
        !editing ? (
          <div>
            <p>
              {t("authenticated_as")} <strong>{username}</strong>.
            </p>
            <button
              onClick={handleEdit}
              style={{
                padding: "10px",
                backgroundColor: "#1a73e8",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {t("edit_credentials")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label htmlFor="username">{t("bluesky_username")}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                marginBottom: "15px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              required
            />
            <label htmlFor="password">{t("app_password")}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.trim())}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                marginBottom: "15px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              required
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#1a73e8",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              {t("login")}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleLogin}>
          <label htmlFor="username">{t("bluesky_username")}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "5px",
              marginBottom: "15px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            required
          />
          <label htmlFor="password">{t("app_password")}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value.trim())}
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "5px",
              marginBottom: "15px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            required
          />
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#1a73e8",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            {t("login")}
          </button>
        </form>
      )}
      {statusMessage && !loading && (
        <p
          style={{
            marginTop: "20px",
            color: statusMessage.type === "error" ? "red" : "green",
          }}
        >
          {statusMessage.message}
        </p>
      )}
    </div>
  );
};

export default Options;
