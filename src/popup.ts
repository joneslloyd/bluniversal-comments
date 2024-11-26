import './bluesky-comments';

interface PostData {
  uri: string;
  title: string;
  url: string;
}

interface Facet {
  index: { byteStart: number; byteEnd: number };
  features: Array<{ $type: string; uri?: string; tag?: string }>;
}

interface PostRecord {
  $type: string;
  text: string;
  facets: Facet[];
  createdAt: string;
}

document.addEventListener('DOMContentLoaded', async () => {
  const commentsContainer = document.getElementById(
    'comments-container',
  ) as HTMLElement;
  const statusContainer = document.getElementById(
    'status-container',
  ) as HTMLElement;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let pageUrl = tab.url || '';
  const pageTitle = tab.title || '';

  pageUrl = normalizeUrl(pageUrl);

  chrome.storage.sync.get(
    ['blueskyAccessJwt', 'blueskyRefreshJwt', 'blueskyDid'],
    async (items) => {
      let accessToken = items.blueskyAccessJwt;
      const refreshToken = items.blueskyRefreshJwt;
      const did = items.blueskyDid;

      if (!accessToken || !did) {
        statusContainer.innerHTML =
          '<p>Please log in to Bluesky via the <a href="options.html" target="_blank">extension options</a>.</p>';
        return;
      }

      let postUri: string | undefined = '';

      try {
        statusContainer.innerHTML = '<p>Searching for existing posts...</p>';

        postUri = (await searchForPost(pageUrl)) || undefined;

        if (!postUri) {
          statusContainer.innerHTML =
            '<p>No existing post found. Creating a new post...</p>';
          postUri = await createNewPost(did, accessToken, pageUrl, pageTitle);
          statusContainer.innerHTML =
            '<p class="success">A new post has been created for this page.</p>';
        } else {
          statusContainer.innerHTML =
            '<p>Loading comments from existing post...</p>';
        }

        const bskyComments = document.createElement(
          'bsky-comments',
        ) as HTMLElement;
        bskyComments.setAttribute('post', postUri);

        commentsContainer.appendChild(bskyComments);

        bskyComments.addEventListener('commentsLoaded', () => {
          statusContainer.innerHTML = '';
        });
      } catch (error: any) {
        if (
          error.message.includes('ExpiredToken') ||
          error.message.includes('Token has expired')
        ) {
          try {
            accessToken = await refreshAccessToken(refreshToken);
            if (!postUri) {
              postUri = await createNewPost(
                did,
                accessToken,
                pageUrl,
                pageTitle,
              );
            }
            statusContainer.innerHTML =
              '<p class="success">Session refreshed. Loading comments...</p>';

            const bskyComments = document.createElement(
              'bsky-comments',
            ) as HTMLElement;
            bskyComments.setAttribute('post', postUri);

            commentsContainer.appendChild(bskyComments);

            bskyComments.addEventListener('commentsLoaded', () => {
              statusContainer.innerHTML = '';
            });
          } catch (refreshError) {
            statusContainer.innerHTML =
              '<p class="error">Session expired. Please log in again via the <a href="options.html" target="_blank">extension options</a>.</p>';
            chrome.storage.sync.remove([
              'blueskyAccessJwt',
              'blueskyRefreshJwt',
              'blueskyDid',
              'blueskyHandle',
            ]);
          }
        } else {
          statusContainer.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        }
      }
    },
  );
});

function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.hostname = parsedUrl.hostname.replace(/^www\./, '');
    parsedUrl.hash = '';
    const paramsToRemove = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
    ];
    paramsToRemove.forEach((param) => parsedUrl.searchParams.delete(param));
    let pathname = parsedUrl.pathname.replace(/\/+$/, '');
    if (!pathname.startsWith('/')) {
      pathname = '/' + pathname;
    }
    const normalizedUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${pathname}${parsedUrl.search}`;
    return normalizedUrl.toLowerCase();
  } catch (error) {
    return url.toLowerCase();
  }
}

async function searchForPost(pageUrl: string): Promise<string | null> {
  const searchParams = new URLSearchParams({
    q: pageUrl,
    limit: '1',
    sort: 'top'
  });

  const searchUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?${searchParams.toString()}`;

  const response = await fetch(searchUrl);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to search for posts: ${response.statusText}\n${errorText}`,
    );
  }

  const data = await response.json();

  const posts: PostData[] = data.posts || [];

  if (posts.length > 0 && posts[0].uri) {
    return posts[0].uri;
  }

  return null;
}

async function createNewPost(
  did: string,
  accessToken: string,
  pageUrl: string,
  pageTitle: string,
): Promise<string> {
  const now = new Date().toISOString();

  const text = `Discussing "${pageTitle}"\n${pageUrl}\n\n#BlueskyComments`;

  const facets: Facet[] = [];

  function getByteIndices(substring: string) {
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    const substringBytes = encoder.encode(substring);

    const index = text.indexOf(substring);
    if (index === -1) {
      return null;
    }

    const preText = text.substring(0, index);
    const preTextBytes = encoder.encode(preText);
    const byteStart = preTextBytes.length;
    const byteEnd = byteStart + substringBytes.length;

    return { byteStart, byteEnd };
  }

  const urlIndices = getByteIndices(pageUrl);
  if (urlIndices) {
    facets.push({
      index: urlIndices,
      features: [
        {
          $type: 'app.bsky.richtext.facet#link',
          uri: pageUrl,
        },
      ],
    });
  }

  const hashtag = '#BlueskyComments';
  const tagIndices = getByteIndices(hashtag);
  if (tagIndices) {
    facets.push({
      index: tagIndices,
      features: [
        {
          $type: 'app.bsky.richtext.facet#tag',
          tag: 'BlueskyComments',
        },
      ],
    });
  }

  const postRecord: PostRecord = {
    $type: 'app.bsky.feed.post',
    text: text,
    facets: facets,
    createdAt: now,
  };

  const response = await fetch(
    'https://bsky.social/xrpc/com.atproto.repo.createRecord',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        repo: did,
        collection: 'app.bsky.feed.post',
        record: postRecord,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (errorText.includes('ExpiredToken')) {
      throw new Error('ExpiredToken');
    }
    throw new Error(
      `Failed to create post: ${response.statusText}\n${errorText}`,
    );
  }

  const data = await response.json();

  return data.uri;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(
    'https://bsky.social/xrpc/com.atproto.server.refreshSession',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();

  chrome.storage.sync.set({
    blueskyAccessJwt: data.accessJwt,
    blueskyRefreshJwt: data.refreshJwt,
    blueskyDid: data.did,
    blueskyHandle: data.handle,
  });

  return data.accessJwt;
}
