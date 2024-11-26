import { bsPoster } from "./api";

new sst.x.DevCommand("BsExtension", {
  link: [bsPoster],
  dev: {
    title: "WXT",
    directory: "./packages/wxt",
    command: "pnpm dev",
  },
});
