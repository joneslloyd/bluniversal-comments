import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    manifest_version: 3,
    name: "Bluniversal Comments",
    version: "1.0",
    description:
      "Universal comments with Bluesky! Displays a Bluesky comments feed for the current page.",
    permissions: ["activeTab", "storage"],
    host_permissions: [
      "https://bsky.social/*",
      "https://bsky.app/*",
      "https://*.bsky.social/*",
      "https://*.bsky.app/*",
      "https://*.bsky.team/*",
      "https://public.api.bsky.app/*",
    ],
  },
  zip: {
    artifactTemplate: "{{name}}-{{browser}}.zip"
  }
});
