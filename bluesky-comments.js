// bluesky-comments.js

class BskyComments extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.visibleCount = 3;
    this.thread = null;
    this.error = null;
  }

  connectedCallback() {
    const postUri = this.getAttribute("post");
    if (!postUri) {
      this.renderError("Post URI is required");
      return;
    }
    this.loadThread(postUri);
  }

  async loadThread(uri) {
    try {
      const thread = await this.fetchThread(uri);
      this.thread = thread;
      this.render();
    } catch (err) {
      if (err.message.includes('ExpiredToken') || err.message.includes('Token has expired')) {
        try {
          const accessToken = await this.refreshAccessToken();
          const thread = await this.fetchThread(uri, accessToken);
          this.thread = thread;
          this.render();
        } catch (refreshError) {
          this.renderError("Session expired. Please log in again.");
          // Clear stored tokens
          chrome.storage.sync.remove(['blueskyAccessJwt', 'blueskyRefreshJwt', 'blueskyDid', 'blueskyHandle']);
        }
      } else {
        this.renderError("Error loading comments");
      }
    }
  }

  async fetchThread(uri, accessToken = null) {
    if (!uri || typeof uri !== "string") {
      throw new Error("Invalid URI: A valid string URI is required.");
    }

    if (!accessToken) {
      accessToken = await new Promise((resolve) => {
        chrome.storage.sync.get(['blueskyAccessJwt'], (items) => {
          resolve(items.blueskyAccessJwt);
        });
      });
    }

    const params = new URLSearchParams({ uri });
    const url = `https://bsky.social/xrpc/app.bsky.feed.getPostThread?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (errorText.includes('ExpiredToken')) {
        throw new Error('ExpiredToken');
      }
      throw new Error(`Failed to fetch thread: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.thread) {
      throw new Error("No comments found");
    }

    return data.thread;
  }

  async refreshAccessToken() {
    const refreshToken = await new Promise((resolve) => {
      chrome.storage.sync.get(['blueskyRefreshJwt'], (items) => {
        resolve(items.blueskyRefreshJwt);
      });
    });

    const response = await fetch('https://bsky.social/xrpc/com.atproto.server.refreshSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();

    // Store the new tokens
    chrome.storage.sync.set({
      blueskyAccessJwt: data.accessJwt,
      blueskyRefreshJwt: data.refreshJwt,
      blueskyDid: data.did,
      blueskyHandle: data.handle,
    });

    return data.accessJwt;
  }

  render() {
    if (!this.thread) {
      this.renderError("No comments found");
      return;
    }

    const replies = this.thread.replies || [];
    const sortedReplies = replies.sort(
      (a, b) => (b.post.likeCount ?? 0) - (a.post.likeCount ?? 0)
    );

    const container = document.createElement("div");
    container.innerHTML = `
      <comments>
        <p class="reply-info">
          Reply on Bluesky
          <a href="https://bsky.app/profile/${this.thread.post?.author?.handle}/post/${this.thread.post?.uri.split("/").pop()}" target="_blank" rel="noopener noreferrer">
            here
          </a> to join the conversation.
        </p>
        <div id="comments"></div>
        <button id="show-more">
          Show more comments
        </button>
      </comments>
    `;

    const commentsContainer = container.querySelector("#comments");
    sortedReplies.slice(0, this.visibleCount).forEach((reply) => {
      commentsContainer.appendChild(this.createCommentElement(reply));
    });

    const showMoreButton = container.querySelector("#show-more");
    if (this.visibleCount >= sortedReplies.length) {
      showMoreButton.style.display = "none";
    }
    showMoreButton.addEventListener("click", () => {
      this.visibleCount += 5;
      this.render();
    });

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(container);

    if (!this.hasAttribute("no-css")) {
      this.addStyles();
    }
  }

  createCommentElement(reply) {
    const comment = document.createElement("div");
    comment.classList.add("comment");

    const author = reply.post.author;
    const text = reply.post.record?.text || "";

    comment.innerHTML = `
      <div class="author">
        <a href="https://bsky.app/profile/${author.handle}" target="_blank" rel="noopener noreferrer">
          ${author.avatar ? `<img width="22px" src="${author.avatar}" />` : ''}
          ${author.displayName ?? author.handle}
        </a>
        <p class="comment-text">${text}</p>
        <small class="comment-meta">
          ${reply.post.likeCount ?? 0} likes • ${reply.post.replyCount ?? 0} replies
        </small>
      </div>
    `;

    if (reply.replies && reply.replies.length > 0) {
      const repliesContainer = document.createElement("div");
      repliesContainer.classList.add("replies-container");

      reply.replies
        .sort((a, b) => (b.post.likeCount ?? 0) - (a.post.likeCount ?? 0))
        .forEach((childReply) => {
          repliesContainer.appendChild(this.createCommentElement(childReply));
        });

      comment.appendChild(repliesContainer);
    }

    return comment;
  }

  renderError(message) {
    const container = document.createElement('div');
    container.innerHTML = `
      <p class="error">${message}</p>
      <p>No comments yet. Be the first to start the conversation on <a href="https://bsky.app/" target="_blank">Bluesky</a>!</p>
    `;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(container);
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      comments {
        margin: 0 auto;
        padding: 1.2em;
        max-width: 280px;
        display: block;
      }
      .reply-info {
        font-size: 14px;
      }
      #show-more {
        margin-top: 10px;
        width: 100%;
        padding: 1em;
        font: inherit;
        box-sizing: border-box;
        background: rgba(0,0,0,0.05);
        border-radius: 0.8em;
        cursor: pointer;
        border: 0;
      }
      #show-more:hover {
        background: rgba(0,0,0,0.1);
      }
      .comment {
        margin-bottom: 2em;
      }
      .author a {
        font-size: 0.9em;
        margin-bottom: 0.4em;
        display: inline-block;
        color: gray;
        text-decoration: none;
      }
      .author a:hover {
        text-decoration: underline;
      }
      .author img {
        margin-right: 0.4em;
        border-radius: 100%;
        vertical-align: middle;
      }
      .comment-text {
        margin: 5px 0;
      }
      .comment-meta {
        color: gray;
        display: block;
        margin: 1em 0 2em;
      }
      .replies-container {
        border-left: 1px solid #ccc;
        margin-left: 1.6em;
        padding-left: 1.6em;
      }
      .error {
        color: red;
        padding: 1em;
        text-align: center;
      }
    `;
    this.shadowRoot.appendChild(style);
  }
}

customElements.define("bsky-comments", BskyComments);
