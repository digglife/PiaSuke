chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();

  let randomId = crypto.randomUUID();
  chrome.storage.local.set({ deviceID: randomId }, () => {
    console.log("deviceID initialize: ", randomId);
  });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  const PIA_APIV1 = "https://api.p.pia.jp/v1";
  p = message;

  fetch(
    `${PIA_APIV1}/webview/locked/cnt/cnt-11-02_${p.contentTypeId}_${p.contentId}.html?contentId=${p.contentId}&contentTypeId=${p.contentTypeId}`,
    {
      headers: { "x-dpia-accesstoken": p.accessToken },
      redirect: "follow",
    }
  )
    .then((response) => {
      if (response.ok) {
        console.log(response.url);
        return response.text();
      }
      throw new Error(`HTTP Error: ${response.status}`);
    })
    .then((text) => {
      sendResponse({ content: text });
      // DOMParser is not available for service_worker.
      if (text.includes("dpia-app://billingIntro")) {
        console.warn("subscription is needed for this content.");
        chrome.action.setBadgeBackgroundColor({ color: "#ff9966" }); // orange color
        chrome.action.setBadgeText({ text: "¥", tabId: sender.tab.id }); // indicate money is required
        return;
      }
      chrome.action.setBadgeText({ text: "✓", tabId: sender.tab.id });
    })
    .catch((error) => {
      console.warn(error);
      chrome.action.setBadgeBackgroundColor({ color: "#ff9966" });
      chrome.action.setBadgeText({ text: "✗", tabId: sender.tab.id });
    });
  return true;
});
