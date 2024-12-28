import React, { useState, useEffect } from "react";
import i18n from "../../i18nConfig";
import { BlueskyAgentManager } from "@bluniversal-comments/core/utils";
import { maybeInitializeDevModeAgent } from "../utils";

const Options: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true); // Unified loading state
  const [editing, setEditing] = useState(false);

  const agentManager = new BlueskyAgentManager();

  useEffect(() => {
    const initialize = async () => {
      try {
        await maybeInitializeDevModeAgent(agentManager);
        await checkSessionStatus();
      } catch (error) {
        console.error("Error during initialization:", error);
        setStatusMessage("Initialization failed. Please log in.");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const checkSessionStatus = async () => {
    try {
      const agent = await agentManager.getAgent();
      if (agent.session?.accessJwt) {
        setSessionValid(true);
        setUsername(agent.session.handle || "");
        setStatusMessage("Active session verified.");
      } else {
        setSessionValid(false);
        setStatusMessage("No active session found. Please log in.");
      }
    } catch (error) {
      console.error("Error verifying session:", error);
      setSessionValid(false);
      setStatusMessage("Failed to verify session. Please log in.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("Logging in...");
    setLoading(true);

    try {
      await agentManager.logout();
      await agentManager.login(username, password);
      setSessionValid(true);
      setStatusMessage("Logged in successfully!");
      setEditing(false);
    } catch (error: any) {
      setSessionValid(false);
      setStatusMessage(`Error: ${error.message}`);
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
      <h1>Bluniversal Comments – Log in to Bluesky</h1>

      {loading ? (
        <p>Loading...</p>
      ) : sessionValid ? (
        !editing ? (
          <div>
            <p>
              Authenticated as <strong>{username}</strong>.
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
              Edit Credentials
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label htmlFor="username">Bluesky Username:</label>
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
            <label htmlFor="password">App Password:</label>
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
              Login
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleLogin}>
          <label htmlFor="username">Bluesky Username:</label>
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
          <label htmlFor="password">App Password:</label>
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
            Login
          </button>
        </form>
      )}

      {statusMessage && !loading && (
        <p
          style={{
            marginTop: "20px",
            color:
              statusMessage.includes("Error") ||
              statusMessage.includes("No active")
                ? "red"
                : "green",
          }}
        >
          {i18n.__(statusMessage)}
        </p>
      )}
    </div>
  );
};

export default Options;
