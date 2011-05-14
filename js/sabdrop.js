/*jslint browser: true, strict: true, indent: 4 */
/*global chrome, webkitNotifications, SABdrop, SABapi*/
(function (window) {
    "use strict";

    window.pageActionData = []; // TODO: Is there a better way to send data to the page action?
    
    var api = new SABapi(localStorage.host, localStorage.apiKey);

    function sendLink(link) {
        var basename = SABdrop.Common.basename(link);
        api.sendLink(link, basename, function (success) {
            var title, text;

            var popupHide = localStorage["popupHide"] || 5000;
            if (popupHide >= 0) {
                if (success) {
                    title = basename;
                    text = chrome.i18n.getMessage("sent_popup", SABdrop.Common.truncate(basename, 20));
                } else {
                    title = chrome.i18n.getMessage("error_popup_title");
                    text = chrome.i18n.getMessage("error_popup");
                }

                var notification = webkitNotifications.createNotification(
                    "images/icons/sab48.png", title, text
                );

                notification.ondisplay = function () {
                    window.setTimeout(function () {
                        notification.cancel();
                    }, popupHide);
                };

                notification.show();
            }
        });
    }

    chrome.contextMenus.create(
        {
            "title": chrome.i18n.getMessage("context_menu"),
            "contexts": ["link"],
            "onclick": function (info, tab) {
                sendLink(info.linkUrl);
            }
        }
    );

    // Receive message from content script and page action
    chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
        switch (request.action) {
            case "pageAction":
                window.pageActionData[sender.tab.id] = request.data;
                chrome.pageAction.show(sender.tab.id);
                break;
            case "downloadLink":
                sendLink(request.link);
                break;
            case "reloadConfig":
                console.info("Reloading SABdrop configuration");
                api.setHost(localStorage.host);
                api.setAPIKey(localStorage.apiKey);
                break;
        }
        sendResponse({}); // clean up
    });

    // open options page if extension hasn't been configured yet
    if (!localStorage["host"]) {
        chrome.tabs.create({url: "options.html"});
    }
}(window));
