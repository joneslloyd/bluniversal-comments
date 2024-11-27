export const bsPoster = new sst.aws.Function("BsPoster", {
  url: true,
  handler: "packages/functions/src/api.handler",
  environment: {
    username: process.env.BS_USERNAME,
    password: process.env.BS_PASSWORD,
    sharedSecret: process.env.BS_SHARED_SECRET,
  },
});
