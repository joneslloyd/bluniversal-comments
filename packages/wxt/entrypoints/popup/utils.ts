export async function searchForPost(tag: string): Promise<string | null> {
  const response = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=%23${tag}&author=bluniversal.bsky.social&tag=${tag}&sort=top&limit=1`,
  );
  if (!response.ok) {
    throw new Error(`Failed to search for posts: ${response.statusText}`);
  }
  const data = await response.json();
  return data.posts?.[0]?.uri || null;
}

export async function createNewPost(
  pageUrl: string,
  pageTitle: string,
): Promise<string> {
  const lambdaUrl = import.meta.env.WXT_LAMBDA_URL;
  const response = await fetch(lambdaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: pageTitle,
      url: pageUrl,
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
};
