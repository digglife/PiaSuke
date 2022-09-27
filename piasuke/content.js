async function replaceWithAppContent() {
  let [appBtn] = document.querySelectorAll(
    "div.js-ua-pcOnly > a.js-dialogLink-app"
  );
  if (!appBtn) {
    return;
  }
  console.debug("app button found");

  const PIA_APIV1 = "https://api.p.pia.jp/v1";
  const PIA_HEADERS = {
    host: "api.p.pia.jp",
    "content-type": "application/json",
    "user-agent":
      "Dpia/4.5.0 (jp.co.pia.DigitalPia; build:125; iOS 15.6.1) Alamofire/5.4.0",
  };

  chrome.storage.local.get(["deviceID"], async function (result) {
    deviceID = result.deviceID;
    chrome.storage.local.get(["token"], async function (result) {
      t = result.token;
      console.debug(
        `app token in local storage: ${JSON.stringify(result.token)}`
      );
      if (
        !t ||
        Date.now() > (t.accessToken.expiresAt + t.accessToken.expiresIn) * 1000
      ) {
        console.debug("app token not found or expired");
        await fetch(PIA_APIV1 + "/authentication/user", {
          method: "POST",
          headers: PIA_HEADERS,
          body: JSON.stringify({ deviceType: 1, deviceId: deviceID }),
        })
          .then(async function (response) {
            t = await response.json();
            fetch(PIA_APIV1 + "/authentication/user/ack", {
              method: "POST",
              headers: { "x-dpia-accesstoken": t.accessToken.token },
              body: "", //empty body is required here
            })
              .then((response) => {
                if (response.ok) {
                  return response.json();
                }
                throw new Error(`failed send ack request: ${response.status}`);
              })
              .then((ack) => {
                if (ack.success) return;
                etype = ack.type || "unknown error";
                throw new Error(`failed to ack token: ${ack.type}`);
              });
          })
          .catch((error) => {
            console.error("unable to authenticate" + error);
          });
      }

      chrome.storage.local.set({ token: t }, () => {
        console.debug(`token set as:` + JSON.stringify(t));
      });

      c = JSON.parse(
        document.getElementById("mainContents").getAttribute("data-param")
      );
      console.debug("content meta in HTML: " + JSON.stringify(c));

      payload = {
        accessToken: t.accessToken.token,
        contentId: c.contentId,
        contentTypeId: c.contentTypeId,
      };

      chrome.runtime.sendMessage(payload, (response) => {
        console.debug(response.content);
        main = document.querySelector("div.md-mainTitleArea__content");
        parser = new DOMParser();
        doc = parser.parseFromString(response.content, "text/html");
        main.replaceWith(doc.querySelector("div.md-mainTitleArea__content"));
      });
    });
  });
}

replaceWithAppContent();
