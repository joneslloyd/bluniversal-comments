/// <reference path="./.sst/platform/config.d.ts" />

import { updateEnvFile } from "./packages/core/src/utils";
import { resolve as pathResolve } from "node:path";

export default $config({
  app(input) {
    return {
      name: "bluniversal-comments",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const api = await import("./infra/api");
    api.bsPoster.url.apply((url) => {
      updateEnvFile(pathResolve("./packages/wxt/.env"), url);
    });
    await import("./infra/extension");

    return;
  },
});
