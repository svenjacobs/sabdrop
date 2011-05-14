/*jslint browser: true, strict: true, indent: 4 */
/*global jQuery, window, chrome, SABapi*/
(function ($, window, document) {
    "use strict";

    // some i18n
    document.title = chrome.i18n.getMessage("options_title");
    $("#authMethod option[value='apikey']").text(chrome.i18n.getMessage("options_setting_authmethod_api"));
    $("#authMethod option[value='login']").text(chrome.i18n.getMessage("options_setting_authmethod_login"));
    $("label[for='host'] sup").prop("title", chrome.i18n.getMessage("options_setting_host_help"));
    $("label[for='apiKey'] sup").prop("title", chrome.i18n.getMessage("options_setting_apikey_help"));
    $("label[for='popupHide'] sup").prop("title", chrome.i18n.getMessage("options_setting_popuphide_help"));
    $("label[for='authMethod'] sup").prop("title", chrome.i18n.getMessage("options_setting_authmethod_help"));
    $("label[for='username'] sup").prop("title", chrome.i18n.getMessage("options_setting_username_help"));
    $("label[for='password'] sup").prop("title", chrome.i18n.getMessage("options_setting_password_help"));

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
        var api;
        if ($("#authMethod").val() === "apikey") {
            api = new SABapi($("#host").val(), $("#apiKey").val());
        } else {
            api = new SABapi($("#host").val(), $("#username").val(), $("#password").val());
        }
        api.verifyConnection(function (success, response) {
            $("#verifyResult")
                .addClass(success ? "good" : "bad")
                .empty()
                .text(success ? chrome.i18n.getMessage("options_verify_ok") : chrome.i18n.getMessage("options_verify_failed"));
        });
    }

    function authOptions() {
        if ($(this).val() === "apikey") {
            $("#apiKey").prop("disabled", false);
            $("#username, #password").prop("disabled", true);
        } else {
            $("#apiKey").prop("disabled", true);
            $("#username, #password").prop("disabled", false);
        }
    }

    $(window).unload(function () {
        chrome.extension.sendRequest({action: "reloadConfig"});
    });

    defaultOption("host", "http://localhost/sabnzbd");
    defaultOption("authMethod", "apikey");
    defaultOption("popupHide", 5000);

    $("#host, #authMethod, #apiKey, #username, #password, #popupHide")
        .each(load)
        .keyup(save)
        .change(save)
        .click(save);

    $("#verify").click(verify);

    $("#authMethod")
        .each(authOptions)
        .change(authOptions);
}(jQuery, window, document));
