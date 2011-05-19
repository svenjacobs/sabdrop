/*jslint browser: true, strict: true, indent: 4 */
/*global console, chrome, webkitNotifications, SABdrop, SABapi*/
(function (window) {
    "use strict";

    window.pageActionData = []; // TODO: Is there a better way to send data to the page action?
    
    var api;
    if (localStorage.authMethod === "login") {
        api = new SABapi(localStorage.host, localStorage.username, localStorage.password);
    } else {
        api = new SABapi(localStorage.host, localStorage.apiKey);
    }

    function sendLink(link, category) {
        if (category === undefined) {
            category = null;
        }

        var basename = SABdrop.Common.basename(link);
        api.sendLink(link, basename, category, function (success) {
            var title, text;

            var popupHide = localStorage.popupHide || 5000;
            if (popupHide >= 0) {
                if (success) {
                    title = basename;
                    text = chrome.i18n.getMessage("sent_popup", SABdrop.Common.truncate(basename, 20));
                } else {
                    title = chrome.i18n.getMessage("error_popup_title");
                    text = chrome.i18n.getMessage("error_popup");
                }

                var notification = webkitNotifications.createNotification(
                    "images/icons/sab48.png",
                    title,
                    text
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

    function createContextMenus() {
        chrome.contextMenus.removeAll();

        var contextMenuId = chrome.contextMenus.create({
            "title": chrome.i18n.getMessage("context_menu"),
            "contexts": ["link"],
            "onclick": function (info, tab) {
                sendLink(info.linkUrl);
            }
        });

        if (localStorage.hideCategories === "true") {
            return;
        }

        api.categories(function (categories) {
            if (categories.length > 0) {
                chrome.contextMenus.create({
                    "title": chrome.i18n.getMessage("context_menu_nocategory"),
                    "contexts": ["link"],
                    "parentId": contextMenuId,
                    "onclick": function (info, tab) {
                        sendLink(info.linkUrl);
                    }
                });

                categories.forEach(function (cat) {
                    chrome.contextMenus.create({
                        "title": cat,
                        "contexts": ["link"],
                        "parentId": contextMenuId,
                        "onclick": function (info, tab) {
                            sendLink(info.linkUrl, cat);
                        }
                    });
                });
            }
        });
    }

    createContextMenus();

    // Receive message from content script and page action
    chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
        switch (request.action) {
        case "pageAction":
            window.pageActionData[sender.tab.id] = request.data;
            chrome.pageAction.show(sender.tab.id);
            break;
        case "downloadLink":
            sendLink(request.link, request.category);
            break;
        case "reloadConfig":
            console.info("Reloading SABdrop configuration");
            api.setHost(localStorage.host);

            if (localStorage.authMethod === "login") {
                api.setAuthMethod("login");
                api.setUsername(localStorage.username);
                api.setPassword(localStorage.password);
            } else {
                api.setAuthMethod("apikey");
                api.setAPIKey(localStorage.apiKey);
            }

            createContextMenus(); // recreate menus because of categories
            break;
        case "getCategories":
            if (localStorage.hideCategories === "true") {
                sendResponse([]);
            } else {
                api.categories(function (categories) {
                    sendResponse(categories);
                });
            }
            return;
        case "getLocalStorage":
            sendResponse(localStorage[request.attribute]);
            return;
        }
        sendResponse({}); // clean up
    });

    // open options page if extension hasn't been configured yet
    if (!localStorage.host) {
        chrome.tabs.create({url: "options.html"});
    }
}(window));
