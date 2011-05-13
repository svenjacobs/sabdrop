/*jslint browser: true, strict: true, indent: 4 */
/*global jQuery, chrome, SABdrop*/
(function ($) {
    "use strict";

    var data = chrome.extension.getBackgroundPage().pageActionData;
    $.each(data, function (index, item) {
        var name = SABdrop.Common.basename(item);

        if (name !== null) {
            $("#downloads ul").append(
                $("<li>")
                    .text(SABdrop.Common.truncate(name))
                    .prop("title", name)
                    .data("link", item)
                    .click(function () {
                        $(this).addClass("clicked");
                        chrome.extension.sendRequest({action: "downloadLink", link: $(this).data("link")});
                    })
            );
        }
    });
}(jQuery));
