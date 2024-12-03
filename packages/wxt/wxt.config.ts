import { defineConfig } from "wxt";

export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: ({ mode, command, browser }) => {
    const isFirefox = browser === "firefox";
    const isDevelopment = mode !== "production";

    return {
      manifest_version: 3,
      name: "Bluniversal Comments",
      version: "1.0.2",
      description:
        "Universal comments with Bluesky! Displays a Bluesky comments feed for the current page.",
      permissions: isFirefox
        ? ["activeTab", "storage"] // Firefox-compatible permissions
        : [
            "activeTab",
            "storage",
            "https://bsky.social/*",
            "https://bsky.app/*",
            "https://bsky.team/*",
            "https://public.api.bsky.app/*",
          ],
      host_permissions: isFirefox
        ? [
            "https://bsky.social/*",
            "https://bsky.app/*",
            "https://bsky.team/*",
            "https://public.api.bsky.app/*",
          ]
        : [
            "https://*.bsky.social/*",
            "https://*.bsky.app/*",
            "https://*.bsky.team/*",
            "https://public.api.bsky.app/*",
          ],
      content_security_policy: {
        extension_pages: "script-src 'self'; object-src 'self';",
      },
      ...(isFirefox && {
        browser_specific_settings: {
          gecko: {
            id: "{123e4567-e89b-12d3-a456-426614174000}",
            strict_min_version: "58.0",
          },
        },
      }),
    };
  },
  zip: {
    artifactTemplate: "{{name}}-{{browser}}.zip",
  },
});
