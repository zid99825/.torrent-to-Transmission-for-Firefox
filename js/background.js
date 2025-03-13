var interval;

browser.contextMenus.create(
    {
        id: "context-menu",
        title: ".torrent To Transmission",
        contexts: ["link"],
    }
);


browser.contextMenus.create(
    {
        id: "options",
        title: "Option",
        contexts: ["browser_action"],
    }
);

browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "context-menu") {
        torrentOnClick(info, tab)
    } else if (info.menuItemId === "options") {
        browser.runtime.openOptionsPage()
    }
});

/*chrome.contextMenus.create({
    "type": "separator",
    "contexts": ["link"],
    "onclick": torrentOnClick,
});

chrome.contextMenus.create({
    "title": ".torrent to Transmission2",
    "contexts": ["link"],
    "onclick": torrentOnClick,
});*/

/*
    Initial load.
*/
var options = [
    {
        key: 'rpcUser',
        default: ''
    },
    {
        key: 'rpcPass',
        default: ''
    },
    {
        key: 'rpcURL',
        default: 'http://localhost:9091/transmission/rpc'
    },
    {
        key: 'webURL',
        default: 'http://localhost:9091'
    },
    {
        key: 'displayNotification',
        default: true
    },
    {
        key: 'notificationDuration',
        default: 10
    },
    {
        key: 'refreshRate',
        default: 5
    },
    {
        key: 'sendTorrentFile',
        default: false
    },
    {
        key: 'selected_list',
        default: 'all'
    },
    {
        key: 'enable-additional-paths',
        default: false
    }
];

options.forEach(function (configItem) {
    if (localStorage[configItem.key] === undefined) {
        localStorage[configItem.key] = configItem.default;
    }
});

interval = setInterval(update, localStorage.refreshRate * 1000);

browser.runtime.onConnect.addListener(function (port) {
    if (port.name == "options") {
        port.onMessage.addListener(function (msg) {
            if (msg.method == "rpc-test") {
                rpc_request(msg.json, function (req) {
                    port.postMessage({
                        "method": "rpc-test",
                        "req": {
                            "status": req.status,
                            "responseText": req.responseText
                        }
                    });
                }, msg.url, msg.user, msg.pass);
            }
            else if (msg.method == "reset-host") {
                resetHost();
            }
        });
    }
    else if (port.name == "list") {
        port.onMessage.addListener(function (msg) {
            if (msg.method == "rpc-call") {
                msg.json.tag = TAGNO;
                rpc_request(msg.json, function (req) {
                    update();
                    port.postMessage({
                        "method": "rpc-complete",
                        "req": req
                    });
                });
            }
        });
    }
});

function onStorageChange(event) {
    if (event.key == "refreshRate") {
        clearInterval(interval);
        interval = setInterval(update, localStorage.refreshRate * 1000);
    }
    else if (event.key == "rpcURL") {
        localStorage.sessionId = "";
        localStorage.setItem("torrents", JSON.stringify({}));
    }
}

if (window.addEventListener)
    window.addEventListener("storage", onStorageChange, false);
else
    window.attachEvent("onstorage", onStorageChange);

// reset torrents on page creation
localStorage.setItem("torrents", JSON.stringify({}));
update();
