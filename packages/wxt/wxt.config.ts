import { defineConfig } from "wxt";

const isFirefox = import.meta.env.FIREFOX;
const isDevelopment = import.meta.env.DEV;

export default defineConfig({
  extensionApi: isFirefox ? "webextension-polyfill" : "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    manifest_version: 3,
    name: "Bluniversal Comments",
    version: "1.0",
    description:
      "Universal comments with Bluesky! Displays a Bluesky comments feed for the current page.",
    permissions: isFirefox
      ? ["activeTab", "storage"]
      : [
          "activeTab",
          "storage",
          "https://*.bsky.social/*",
          "https://*.bsky.app/*",
          "https://*.bsky.team/*",
          "https://public.api.bsky.app/*",
        ],
    host_permissions: isFirefox
      ? []
      : [
          "https://bsky.social/*",
          "https://bsky.app/*",
          "https://*.bsky.social/*",
          "https://*.bsky.app/*",
          "https://*.bsky.team/*",
          "https://public.api.bsky.app/*",
        ],
    content_security_policy: {
      extension_pages: isDevelopment ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:*; object-src 'self'; connect-src ws://localhost:*;" : "script-src 'self'; object-src 'self';",
    },
  },
  zip: {
    artifactTemplate: "{{name}}-{{browser}}.zip",
  },
});
