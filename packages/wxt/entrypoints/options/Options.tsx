import React, { useState } from "react";

const Options: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage("Logging in...");

    try {
      // Send the login request to Bluesky
      const response = await fetch(
        "https://bsky.social/xrpc/com.atproto.server.createSession",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier: username.trim(),
            password: password.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Invalid username or app password");
      }

      // Save credentials to Chrome's storage
      const data = await response.json();
      chrome.storage.sync.set(
        {
          blueskyAccessJwt: data.accessJwt,
          blueskyRefreshJwt: data.refreshJwt,
          blueskyDid: data.did,
          blueskyHandle: data.handle,
        },
        () => {
          setStatusMessage("Logged in successfully!");
        },
      );
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };
  console.log("🍍");
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1>Bluesky Login</h1>
      <form onSubmit={handleLogin}>
        <label htmlFor="username">Bluesky Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          onChange={(e) => setPassword(e.target.value)}
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
      {statusMessage && (
        <p
          style={{
            marginTop: "20px",
            color: statusMessage.includes("Error") ? "red" : "green",
          }}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
};

export default Options;
