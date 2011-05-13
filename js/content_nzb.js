/*jslint browser: true, strict: true, indent: 4 */
/*global jQuery, chrome, window*/
(function ($, window) {
    "use strict";

    var nzb = [];
    $("*[href$='.nzb']").each(function () {
        var url = $(this).attr("href");

        if (!/^(file|https?):\/\//.exec(url)) {
            url = window.location.protocol + "//" + window.location.host + url;
        }

        nzb.push(url);
    });

    if (nzb.length > 0) {
        // tell the background page that we've found some NZBs
        chrome.extension.sendRequest({action: "pageAction", data: nzb});
    }
}(jQuery, window));
