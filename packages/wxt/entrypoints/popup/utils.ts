const generateHmac = async (
  secret: string,
  payload: string,
): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export async function createNewPost(
  pageUrl: string,
  pageTitle: string,
): Promise<string> {
  const sharedSecret = import.meta.env.WXT_BS_SHARED_SECRET;
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${pageUrl}|${pageTitle}|${timestamp}`;
  const hash = await generateHmac(sharedSecret, payload);

  const lambdaUrl = import.meta.env.WXT_LAMBDA_URL;

  const response = await fetch(lambdaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: pageTitle,
      url: pageUrl,
      timestamp,
      hash,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.statusText}`);
  }

  return (await response.json()).uri;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<string> {
  const response = await fetch(
    "https://bsky.social/xrpc/com.atproto.server.refreshSession",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }
  const data = await response.json();
  chrome.storage.sync.set({
    blueskyAccessJwt: data.accessJwt,
    blueskyRefreshJwt: data.refreshJwt,
    blueskyDid: data.did,
    blueskyHandle: data.handle,
    blueskyActive: data.active,
  });
  return data.accessJwt;
}
