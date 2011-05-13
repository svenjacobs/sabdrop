/*jslint browser: true, strict: true, indent: 4 */
/*global jQuery, window, chrome*/
(function ($, window, document) {
    "use strict";

    // some i18n
    document.title = chrome.i18n.getMessage("options_title");
    $("label[for='host'] sup").prop("title", chrome.i18n.getMessage("options_setting_host_help"));
    $("label[for='apiKey'] sup").prop("title", chrome.i18n.getMessage("options_setting_apikey_help"));
    $("label[for='popupHide'] sup").prop("title", chrome.i18n.getMessage("options_setting_popuphide_help"));

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
            .empty()
            .append($("<img>").attr("src", "images/progress.gif"));
        var api = new SABapi($("#host").val(), $("#apiKey").val());
        api.verifyConnection(function (success, response) {
            $("#verifyResult")
                .addClass(success ? "good" : "bad")
                .empty()
                .text(success ? chrome.i18n.getMessage("options_verify_ok") : chrome.i18n.getMessage("options_verify_failed"));
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
}(jQuery, window, document));
