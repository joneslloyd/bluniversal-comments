document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  document.getElementById('status').innerText = 'Logging in...';

  try {
    const response = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Bluesky Comments Extension',
      },
      body: JSON.stringify({
        identifier: username,
        password: password,
      }),
    });

    if (!response.ok) {
      throw new Error('Invalid username or password');
    }

    const data = await response.json();

    chrome.storage.sync.set({
      blueskyAccessJwt: data.accessJwt,
      blueskyRefreshJwt: data.refreshJwt,
      blueskyDid: data.did,
      blueskyHandle: data.handle,
    }, () => {
      document.getElementById('status').style.color = 'green';
      document.getElementById('status').innerText = 'Logged in successfully!';
    });
  } catch (error) {
    document.getElementById('status').style.color = 'red';
    document.getElementById('status').innerText = `Error: ${error.message}`;
  }
});
