import { bsPoster } from "./api";

new sst.x.DevCommand("BsExtensionChrome", {
  link: [bsPoster],
  dev: {
    title: "WXT Chrome",
    directory: "./packages/wxt",
    command: "pnpm dev",
  },
});

new sst.x.DevCommand("BsExtensionFirefox", {
  link: [bsPoster],
  dev: {
    title: "WXT Firefox",
    directory: "./packages/wxt",
    command: "pnpm dev:firefox",
  },
});
