async function replaceWithAppContent() {
  const PIA_HEADERS = {
    "host": "api.p.pia.jp",
    "content-type": "application/json",
    "user-agent": "Dpia/4.5.0 (jp.co.pia.DigitalPia; build:125; iOS 15.6.1) Alamofire/5.4.0"
  }

  const PIA_APIV1 = "https://api.p.pia.jp/v1"

  let [appBtn] = document.querySelectorAll('div.js-ua-pcOnly > a.js-dialogLink-app')
  if (!appBtn) {
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

        // appBtn.href = response.url
        // appBtn.innerHTML = "View App Contents"
      });
    })
  })
}

let button = document.getElementById("showDeviceID");

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// When the button is clicked, inject setPageBackgroundColor into current page
button.addEventListener("click", async () => {
  let tab = await getCurrentTab();
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: replaceWithAppContent
  },
    printDeviceID()
  );
});

// The body of this function will be execuetd as a content script inside the
// current page
function printDeviceID() {
  chrome.storage.sync.get(["deviceID"], (r) => {
    console.log("ID: ", r.deviceID)
  });
}

