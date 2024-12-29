# Bluniversal Comments

<a title="Chrome Extension" href="https://github.com/joneslloyd/bluniversal-comments?tab=readme-ov-file#chrome-1"><img alt="Chrome" title="Chrome" src="https://github.com/user-attachments/assets/0c7ce099-5622-4ece-9085-05625f4e3ea5" width="32" /></a>&nbsp;<a href="https://github.com/joneslloyd/bluniversal-comments?tab=readme-ov-file#firefox" title="Firefox Extension"><img alt="Firefox" title="Firefox" src="https://github.com/user-attachments/assets/b5c7df03-217b-46f1-b073-48efe9f14dd6" width="32" /></a>&nbsp;<a href="https://github.com/joneslloyd/bluniversal-comments?tab=readme-ov-file#edge" title="Edge Extension"><img alt="Edge" title="Edge" src="https://github.com/user-attachments/assets/f343083e-3880-4e5d-83ba-7c3abd0f2d8d" width="32" /></a>

Available in: 🇬🇧, 🇭🇺, 🇨🇳, 🇫🇷 and 🇯🇵

<img alt="Bluniversal Comments" title="Bluniversal Comments" src="https://github.com/user-attachments/assets/c72a7bf1-4633-4c3b-9df3-0acc82939bd8" width="800" />

Bluniversal Comments is a Chrome Extension enabling "universal comments" via Bluesky, directly on web pages. With this extension, you can view, comment, and engage with Bluesky discussions linked to any web page.

---

## How to Use the Extension

### Stable version

#### Chrome

[Download the Extension via the Chrome Web Store](https://chromewebstore.google.com/detail/bluniversal-comments/ecigkjcgabichgpbmeffblnbcbifighl).

### Latest (unstable) version

#### Step 1: Download the Extension

First, visit the **[Releases](https://github.com/joneslloyd/bluniversal-comments/releases)** page on the GitHub repository.

Then, depending on your browser:

##### Chrome

Download the latest `chrome-extension.zip` file for the extension.

##### Firefox

Download the latest `firefox-extension.zip` file for the extension.

##### Edge

Download the latest `edge-extension.zip` file for the extension.

#### Step 2: Install the Extension

##### Chrome & Edge

1. Unpackage the `.zip` file to a directory on your computer.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner of the page.
4. Click the **Load unpacked** button.
5. Select the directory where you unpackaged the `.zip` file.

##### Firefox

1. Download the `.zip` file to a directory on your computer, but don't unpackage it.
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click the **Load Temporary Add-On** button.
4. Select the directory containing the `.zip` file.

#### Step 3: Pin the Extension

##### Chrome & Edge

1. Click the Extensions icon
2. Find the Extension in the list
3. Click the pin (📌) icon next to it

##### Firefox

1. Click the Extensions icon
2. Find the Extension in the list
3. Click the cog (⚙️) icon next to it
4. Click "Pin to toolbar"

#### Step 4: Use the Extension

1. Open any supported webpage.
2. Click the Bluniversal Comments extension icon in the browser toolbar.
3. Log in to your Bluesky account using your username and app password – A new tab should open automatically, but if not:

##### Chrome & Edge

Navigate to the **Options** page (accessible by right-clicking on the extension icon and then Options).

##### Firefox

In the Temporary Extension page, click the three dots (...) icon next to the Bluniversal Comments Extension, and then click Preferences.

4. Once logged in, go to any web page and interact with existing Bluesky discussions or start a new thread for the page you're viewing.

---

## License

Bluniversal Comments is distributed under the **Server Side Public License (SSPL)**. This Source-Available license ensures that:

- You are free to view, modify, and use the source code for your purposes.
- If you use this code to provide a public-facing service, you are required to release your service's source code under the same license terms.
- The license protects the project against proprietary usage while encouraging collaborative improvement.

For more details, read the full [SSPL License](https://www.mongodb.com/licensing/server-side-public-license).

---

## Features

- **Bluesky Thread Integration**: Connect Bluesky discussions with any webpage.
- **Comment Interaction**: Post, reply to, and like Bluesky threads directly from the extension.
- **Developer Mode Support**: Easily test features using developer credentials during local development.
- **Intelligent Post Creation**: Automatically detects if a thread exists for a page, or creates one if necessary.
- **Secure Authentication**: Safeguards your Bluesky credentials with robust session handling.

---

## Development Guide

### Prerequisites

- Node.js (version >=16)
- SST for Lambda function deployment
- A valid Bluesky account with app password credentials

### Local Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/joneslloyd/bluniversal-comments.git
   cd bluniversal-comments
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Load the unpacked extension from the `packages/wxt/dist` directory in Chrome (`chrome://extensions/`).

---

## Contributions

We welcome contributions to Bluniversal Comments! To contribute:

1. Fork the repository and create a new branch.
2. Make your changes and write tests.
3. Submit a pull request with a clear description of the changes and their purpose.

---

## Troubleshooting

### Issue: "No active session found"

- Ensure you’ve entered valid Bluesky credentials in the Options page.
- If using **Developer Mode**, ensure your `WXT_BS_DEV_USERNAME` and `WXT_BS_DEV_PASSWORD` environment variables are correctly set.

### Issue: "Failed to load comments"

- Check your Bluesky login status and ensure the webpage supports Bluniversal Comments.
- If the issue persists, consult the logs in Chrome's developer console for detailed error messages.

---

## Support

For further assistance, please open an issue in the [GitHub Issues](https://github.com/joneslloyd/bluniversal-comments/issues) page.

## Credits

This is inspired by the work of the following Bluesky users:

- [Emily Liu](https://bsky.app/profile/emilyliu.me)
- [Cory Zue](https://bsky.app/profile/coryzue.com)
- [louee](https://bsky.app/profile/louee.bsky.social)

([Original thread](https://bsky.app/profile/joneslloyd.bsky.social/post/3lbssh3grbc2z)).
