const PIA_HEADERS = {
    "host": "api.p.pia.jp",
    "content-type": "application/json",
    "user-agent": "Dpia/4.5.0 (jp.co.pia.DigitalPia; build:125; iOS 15.6.1) Alamofire/5.4.0"
}

const PIA_APIV1 = "https://api.p.pia.jp/v1"
const contentPrefix = "cnt_11_2"

async function r(endpoint, headers, data) {


    method = data ? "POST" : "GET"
    headers = Object.assign({}, PIA_HEADERS, headers)
    const request = new Request(
        PIA_APIV1 + endpoint,
        {
            method: method,
            body: JSON.stringify(data),
            headers: headers
        })

    return fetch(request)
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(`HTTP Error ${response.status}`)
        })
        .catch((error) => console.error(error))
}

function isTokenExpired(token) {
    return Date.now() > (token.accessToken.expiresAt + token.accessToken.expiresIn) * 1000
}