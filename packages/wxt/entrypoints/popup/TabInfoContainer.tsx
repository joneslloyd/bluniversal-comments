import React, { useEffect } from "react";
import { TabInfo } from "../types";

interface TabInfoContainerProps {
  onTabInfoChange: (
    tabInfo: TabInfo | null,
    errorMessage: string | null,
  ) => void;
  pageNotSupportedMessage: string;
}

const TabInfoContainer: React.FC<TabInfoContainerProps> = ({
  onTabInfoChange,
  pageNotSupportedMessage,
}) => {
  useEffect(() => {
    browser.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab.url) {
        onTabInfoChange(null, pageNotSupportedMessage);
        return;
      }

      if (!isValidUrl(tab.url)) {
        onTabInfoChange(null, pageNotSupportedMessage);
        return;
      }

      onTabInfoChange(
        {
          url: tab.url,
          title: tab.title || "",
        },
        null,
      );
    });
  }, [pageNotSupportedMessage, onTabInfoChange]);

  return null;
};

function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol !== "about:" &&
      parsedUrl.protocol !== "chrome-extension:" &&
      !parsedUrl.hostname.includes("localhost") &&
      !parsedUrl.hostname.includes("newtab")
    );
  } catch {
    return false;
  }
}

export default TabInfoContainer;
