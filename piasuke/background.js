const PIA_HEADERS = {
  "host": "api.p.pia.jp",
  "content-type": "application/json",
  "user-agent": "Dpia/4.5.0 (jp.co.pia.DigitalPia; build:125; iOS 15.6.1) Alamofire/5.4.0"
}

const PIA_APIV1 = "https://api.p.pia.jp/v1"


chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();

  let randomId = crypto.randomUUID()
  chrome.storage.local.set({ deviceID: randomId }, () => {
    console.log('deviceID initialize: ', randomId);
  })

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    let pia = {
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostSuffix: '.pia.jp' },
          css: ["a.js-dialogLink-app"]
        })
      ],
      actions: [
        new chrome.declarativeContent.ShowAction()
      ]
    };
    chrome.declarativeContent.onPageChanged.addRules([pia]);
  });
});

chrome.runtime.onMessage.addListener(
  function (message, _, sendResponse) {
    p = message
    fetch(
      `${PIA_APIV1}/webview/locked/cnt/cnt-11-02_${p.contentTypeId}_${p.contentId}.html?contentId=${p.contentId}&contentTypeId=${p.contentTypeId}`,
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

async function replaceWithAppContent() {
  let [appBtn] = document.querySelectorAll('div.js-ua-pcOnly > a.js-dialogLink-app')
  if (!appBtn) {
    console.debug("app button not found, exit")
    return;
  }
  console.debug("app button found")

  chrome.storage.local.get(['deviceID'], async function (result) {
    deviceID = result.deviceID
    chrome.storage.local.get(['token'], async function (result) {
      t = result.token
      if (!t || Date.now() > (t.accessToken.expiresAt + t.accessToken.expiresIn) * 1000) {
        console.log("app token not found or expired")
        await fetch(PIA_APIV1 + "/authentication/user",
          {
            method: "POST",
            headers: PIA_HEADERS,
            body: JSON.stringify({ "deviceType": 1, "deviceId": deviceID })
          }).then(async function (response) {
            t = await response.json()
            console.log(t)
            fetch(PIA_APIV1 + "/authentication/user/ack",
              {
                method: "POST",
                headers: { "x-dpia-accesstoken": t.accessToken.token },
                body: "" //empty body is required here
              }).then((response) => {
                ack = response.json()
                if (!ack.success) {
                  throw new Error("failed to ack token")
                }
              })
          }).catch((error) => { console.log("unable to authenticate" + error) })
      }
      chrome.storage.local.set({ token: t }, () => { console.log(`token set as:` + JSON.stringify(t)) })

      c = JSON.parse(document.getElementById('mainContents').getAttribute('data-param'))
      console.log("content meta found in PC HTML page: " + JSON.stringify(c))

      payload = {
        accessToken: t.accessToken.token,
        contentId: c.contentId,
        contentTypeId: c.contentTypeId
      }

      chrome.runtime.sendMessage(payload, function (response) {
        console.debug(response.content)
        main = document.querySelector('div.md-mainTitleArea__content')
        parser = new DOMParser
        doc = parser.parseFromString(response.content, "text/html")
        main.replaceWith(doc.querySelector("div.md-mainTitleArea__content"))
      });
    })
  })
}


chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: replaceWithAppContent,
  });
});
