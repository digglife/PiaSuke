// let pia = {
//   conditions: [
//     new chrome.declarativeContent.PageStateMatcher({
//       pageUrl: { hostSuffix: 'pia.com' },
//       css: ["a.js-dialogLink-app"]
//     })
//   ],
//   actions: [
//     //new chrome.declarativeContent.SetIcon({ path: "images/pia-128.png" }),
//     new chrome.declarativeContent.ShowAction()
//   ]
// };

async function getContentURL(p) {
  await fetch(
    `https://api.p.pia.jp/v1/webview/locked/cnt/cnt-11-02_${p.contentTypeId}_${p.contentId}.html?contentId=${p.contentId}&contentTypeId=${p.contentTypeId}`,
    {
      headers: { "x-dpia-accesstoken": p.accessToken },
      redirect: "follow",
    }
  ).then((response) => {
    if (response.ok) {
      console.log(response.url)
      return response.url;
    }
    throw new Error(`HTTP Error: ${response.status}`)
  }).catch((error) => { console.log(error) })
}

chrome.runtime.onInstalled.addListener(() => {
  // chrome.action.disable();
  let randomId = crypto.randomUUID()
  chrome.storage.local.set({ deviceID: randomId }, () => {
    console.log('deviceID initialize: ', randomId);
  })
  // chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
  //   chrome.declarativeContent.onPageChanged.addRules([pia]);
  // });
});

chrome.runtime.onMessage.addListener(
  function (message, _, sendResponse) {
    p = message
    fetch(
      `https://api.p.pia.jp/v1/webview/locked/cnt/cnt-11-02_${p.contentTypeId}_${p.contentId}.html?contentId=${p.contentId}&contentTypeId=${p.contentTypeId}`,
      {
        headers: { "x-dpia-accesstoken": p.accessToken },
        redirect: "follow",
      }
    ).then((response) => {
      if (response.ok) {
        console.log(response.url)
        return response.text()
      }
      throw new Error(`HTTP Error: ${response.status}`)
    }).then((text) => {
      sendResponse({ content: text })
    }).catch((error) => { console.log(error) })
    return true
  }
);