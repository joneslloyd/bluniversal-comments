const username = process.env.BS_USERNAME;

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
});

/*
export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== "install") return;

    // Open a tab on install
    await browser.tabs.create({
      url: browser.runtime.getURL("/popup.html"),
      active: true,
    });
  });
});
*/
