import { bsPassword, bsUsername } from "./secrets";

export const bsPoster = new sst.aws.Function("BsPoster", {
  link: [bsUsername, bsPassword],
  url: true,
  handler: "packages/functions/src/api.handler"
});
