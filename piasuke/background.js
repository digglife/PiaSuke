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
      chrome.action.setBadgeText({ text: "✓", tabId: sender.tab.id });
    })
    .catch((error) => {
      console.error(error);
    });
  return true;
});
