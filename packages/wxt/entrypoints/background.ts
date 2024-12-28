import * as amplitude from "@amplitude/analytics-browser";
import { getBrowserType } from "./utils";

export default defineBackground(() => {
  runAmplitude();
  openOptionsPage();
});

const runAmplitude = () => {
  // Do not track anything more than the install and browser type
  amplitude.init("3f5227f9da39547b9e7c806154c12715", undefined, {
    autocapture: false,
    defaultTracking: false,
    identityStorage: "sessionStorage",
  });
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === "install") {
      amplitude.logEvent("Extension Installed", {
        browserType: getBrowserType(),
      });
    }
  });
};

const openOptionsPage = () => {
  browser.runtime.openOptionsPage();
};
