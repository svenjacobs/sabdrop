/*jslint browser: true, strict: true, indent: 4 */
/*global jQuery, chrome, window*/
(function ($, window) {
    "use strict";

    chrome.extension.sendRequest({action: "getLocalStorage", attribute: "matchPatterns"}, function (response) {
        var nzb = [];
        var patterns = (response || "\\.nzb$").split(/\n/);

        $("*[href]").each(function () {
            var url = $(this).attr("href");
            var matches = false;

            $.each(patterns, function (i, p) {
                if (url.match(p)) {
                    matches = true;
                    return false; // break
                }
            });

            if (matches) {
                if (!/^(file|https?):\/\//.test(url)) {
                    url = window.location.protocol + "//" + window.location.host + url;
                }

                nzb.push(url);
            }
        });

        if (nzb.length > 0) {
            // tell the background page that we've found some NZBs
            chrome.extension.sendRequest({action: "pageAction", data: nzb});
        }
    });

}(jQuery, window));
