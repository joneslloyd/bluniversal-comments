document.getElementById('login-form')!.addEventListener('submit', async (e) => {
  e.preventDefault();

  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  const statusElement = document.getElementById('status') as HTMLElement;
  statusElement.innerText = 'Logging in...';

  try {
    const response = await fetch(
      'https://bsky.social/xrpc/com.atproto.server.createSession',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Bluesky Comments Extension',
        },
        body: JSON.stringify({
          identifier: username,
          password: password,
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Invalid username or password');
    }

    const data = await response.json();

    chrome.storage.sync.set(
      {
        blueskyAccessJwt: data.accessJwt,
        blueskyRefreshJwt: data.refreshJwt,
        blueskyDid: data.did,
        blueskyHandle: data.handle,
      },
      () => {
        statusElement.style.color = 'green';
        statusElement.innerText = 'Logged in successfully!';
      },
    );
  } catch (error: any) {
    statusElement.style.color = 'red';
    statusElement.innerText = `Error: ${error.message}`;
  }
});
