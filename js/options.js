/*jslint browser: true, strict: true, indent: 4 */
/*global jQuery, window, chrome*/
(function ($, window) {
    "use strict";

    function load() {
        var opt = $(this);
        opt.val(localStorage[opt.attr("id")]);
    }

    function save() {
        var opt = $(this);
        localStorage[opt.attr("id")] = opt.val();
    }

    function defaultOption(option, defaultValue) {
        if (!localStorage[option]) {
            localStorage[option] = defaultValue;
        }
    }

    function verify(evt) {
        evt.preventDefault();
        $("#verifyResult")
            .removeClass("good bad")
            .empty();
        var api = new SABapi($("#host").val(), $("#apiKey").val());
        api.verifyConnection(function (success, response) {
            $("#verifyResult")
                .addClass(success ? "good" : "bad")
                .text(success ? "OK" : "FAILED");
        });
    }

    $(window).unload(function () {
        chrome.extension.sendRequest({action: "reloadConfig"});
    });

    defaultOption("host", "http://localhost/sabnzbd");
    defaultOption("popupHide", 5000);

    $("#host, #apiKey, #popupHide")
        .each(load)
        .keyup(save)
        .click(save);

    $("#verify").click(verify);
}(jQuery, window));
