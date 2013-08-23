/*jshint browser: true, plusplus: false, indent: 4 */
/*global $, window, chrome, SABapi, Showdown*/
(function () {
    'use strict';

    // some i18n
    document.title = chrome.i18n.getMessage('options_title');
    $('#authMethod option[value="apikey"]').text(chrome.i18n.getMessage('options_setting_authmethod_api'));
    $('#authMethod option[value="login"]').text(chrome.i18n.getMessage('options_setting_authmethod_login'));
    //$('#nzbName option[value="always"]').text(chrome.i18n.getMessage('options_setting_nzbname_always'));
    //$('#nzbName option[value="never"]').text(chrome.i18n.getMessage('options_setting_nzbname_never'));
    $('label[for="host"]').prepend(chrome.i18n.getMessage('options_setting_host'));
    $('label[for="host"] sup').prop('title', chrome.i18n.getMessage('options_setting_host_help'));
    $('label[for="apiKey"]').prepend(chrome.i18n.getMessage('options_setting_apikey'));
    $('label[for="apiKey"] sup').prop('title', chrome.i18n.getMessage('options_setting_apikey_help'));
    $('label[for="popupHide"]').prepend(chrome.i18n.getMessage('options_setting_popuphide'));
    $('label[for="popupHide"] sup').prop('title', chrome.i18n.getMessage('options_setting_popuphide_help'));
    $('label[for="authMethod"]').prepend(chrome.i18n.getMessage('options_setting_authmethod'));
    $('label[for="authMethod"] sup').prop('title', chrome.i18n.getMessage('options_setting_authmethod_help'));
    $('label[for="username"]').prepend(chrome.i18n.getMessage('options_setting_username'));
    $('label[for="username"] sup').prop('title', chrome.i18n.getMessage('options_setting_username_help'));
    $('label[for="password"]').prepend(chrome.i18n.getMessage('options_setting_password'));
    $('label[for="password"] sup').prop('title', chrome.i18n.getMessage('options_setting_password_help'));
    $('label[for="hideCategories"]').prepend(chrome.i18n.getMessage('options_setting_hidecategories'));
    $('label[for="hideCategories"] sup').prop('title', chrome.i18n.getMessage('options_setting_hidecategories_help'));
    $('label[for="matchPatterns"]').prepend(chrome.i18n.getMessage('options_setting_matchpatterns'));
    $('label[for="matchPatterns"] sup').prop('title', chrome.i18n.getMessage('options_setting_matchpatterns_help'));
    $('label[for="noFileUpload"]').prepend(chrome.i18n.getMessage('options_setting_fileupload'));
    $('label[for="noFileUpload"] sup').prop('title', chrome.i18n.getMessage('options_setting_fileupload_help'));
    //$('label[for="nzbName"]').prepend(chrome.i18n.getMessage('options_setting_nzbname'));
    //$('label[for="nzbName"] sup').prop('title', chrome.i18n.getMessage('options_setting_nzbname_help'));
    $('label[for="requestInterval"]').prepend(chrome.i18n.getMessage('options_setting_requestinterval'));
    $('label[for="requestInterval"] sup').prop('title', chrome.i18n.getMessage('options_setting_requestinterval_help'));
    $('label[for="speedSliderMin"]').prepend(chrome.i18n.getMessage('options_setting_speedslidermin'));
    $('label[for="speedSliderMin"] sup').prop('title', chrome.i18n.getMessage('options_setting_speedslidermin_help'));
    $('label[for="speedSliderMax"]').prepend(chrome.i18n.getMessage('options_setting_speedslidermax'));
    $('label[for="speedSliderMax"] sup').prop('title', chrome.i18n.getMessage('options_setting_speedslidermax_help'));
    $('label[for="speedSliderStep"]').prepend(chrome.i18n.getMessage('options_setting_speedsliderstep'));
    $('label[for="speedSliderStep"] sup').prop('title', chrome.i18n.getMessage('options_setting_speedsliderstep_help'));
    $('a[href="#options"]').text(chrome.i18n.getMessage('options_tab'));
    $('a[href="#advanced"]').text(chrome.i18n.getMessage('options_tab_advanced'));
    $('a[href="#about"]').text(chrome.i18n.getMessage('options_tab_about'));

    function setVal(opt, val) {
        opt = $(opt);
        if (opt.attr('type') === 'checkbox') {
            opt.prop('checked', val === true || val === 'true' ? true : false);
        } else {
            opt.val(val);
        }
    }

    function load() {
        setVal(this, localStorage[$(this).attr('id')]);
    }

    function save() {
        var opt = $(this),
            val;

        if (opt.attr('type') === 'checkbox') {
            val = opt.is(':checked').toString();
        } else {
            val = opt.val();
        }

        localStorage[opt.attr('id')] = val;
    }

    /**
     * If option is not available in localStorage, default value
     * will be loaded from DOM object and put into storage.
     */
    function defaultValue() {
        var opt = $(this);

        if (!localStorage[opt.attr('id')]) {
            localStorage[opt.attr('id')] = opt.data('default');
        }
    }

    /**
     * Makes sure that values of type="number" fields with
     * "min" attributes are not less than "min"
     */
    function minValue() {
        var $t = $(this),
            min;

        if ($t.is('input[type="number"][min]')) {
            min = parseInt($t.attr('min'), 10);
            
            if (parseInt($t.val(), 10) < min) {
                $t.val(min);
            }
        }
    }

    function verify(evt) {
        var api,
            result;

        evt.preventDefault();
        $('#verify').button('option', 'disabled', true);
        $('#verifyResult')
            .removeClass('good bad')
            .empty()
            .append($('<img>').attr('src', 'images/progress.gif'));

        if ($('#authMethod').val() === 'apikey') {
            api = new SABapi($('#host').val(), $('#apiKey').val());
        } else {
            api = new SABapi($('#host').val(), $('#username').val(), $('#password').val());
        }

        result = function (success, text) {
            $('#verify').button('option', 'disabled', false);
            $('#verifyResult')
                .empty()
                .addClass(success ? 'good' : 'bad')
                .text(text);
        };

        api.getRemoteAuthMethod(function (success, responseText) {
            if (!success) {
                result(false, chrome.i18n.getMessage('options_verify_failed'));
            } else if ($('#authMethod').val() === responseText) {
                api.verifyConnection(function (success) {
                    result(success, success ? chrome.i18n.getMessage('options_verify_ok') : chrome.i18n.getMessage('options_verify_failed'));
                });
            } else if (responseText === 'badkey') {
                result(false, chrome.i18n.getMessage('options_verify_failed'));
            } else if (responseText === 'none') {
                result(false, chrome.i18n.getMessage('options_verify_none'));
            } else {
                result(false, chrome.i18n.getMessage('options_verify_nomatch'));
            }
        });
    }

    function authOptions() {
        if ($(this).val() === 'apikey') {
            $('#apiKey').prop('disabled', false);
            $('#username, #password').prop('disabled', true);
        } else {
            $('#apiKey').prop('disabled', true);
            $('#username, #password').prop('disabled', false);
        }
    }

    function reset() {
        $('#resetDialog').dialog({
            resizeable: false,
            modal: true,
            width: 400,
            title: chrome.i18n.getMessage('options_reset'),
            buttons: [
                {
                    text: chrome.i18n.getMessage('yes'),
                    click: function () {
                        $('input, select, textarea')
                            .each(function () {
                                setVal(this, $(this).data('default'));
                            })
                            .each(save);
                        authOptions.call($('#authMethod'));
                        $(this).dialog('close');
                    }
                },
                {
                    text: chrome.i18n.getMessage('no'),
                    click: function () {
                        $(this).dialog('close');
                    }
                }
            ]
        });
    }

    var credits = [
        'The SABnzbd team',
        'The jQuery and jQuery UI developers for great and very useful JavaScript libraries',
        'Google for their Chrome browser and other products',
        'GitHub for hosting this project'
    ];

    function startCredits() {
        var TIMEOUT = 5000,
            index = 0,
            show = function () {
                var text = credits[index];
                $('#credits')
                    .css('left', 0) // reset style attribute because of strange behaviour when tab is inactive (interval is paused)
                    .show('slide', {direction: 'left'}, 600, function () {
                        if (index === credits.length - 1) {
                            index = 0;
                        } else {
                            index++;
                        }
                    })
                    .html(text);
            };

        $('#credits').data('running', true);
        show();

        window.setInterval(function () {
            var crdt = $('#credits');
            if (crdt.is(':visible')) {
                crdt.fadeOut(400, show);
            } else {
                show();
            }
        }, TIMEOUT);
    }

    $(window).unload(function () {
        chrome.extension.getBackgroundPage().getApi().reloadConfig();
    });

    $('#requestInterval').change();

    $('input, select, textarea')
        .each(defaultValue)
        .each(load)
        .change(minValue)
        .change(save)
        .keyup(save)
        .mousewheel(save)
        .click(save);

    $('#save')
        .text(chrome.i18n.getMessage('options_save'))
        .button()
        .click(function () {
            chrome.extension.getBackgroundPage().getApi().reloadConfig();
        });

    $('#verify')
        .text(chrome.i18n.getMessage('options_verify'))
        .button()
        .click(verify);

    $('#reset')
        .text(chrome.i18n.getMessage('options_reset'))
        .button()
        .click(reset);

    $('#authMethod')
        .each(authOptions)
        .change(authOptions);

    $('#host')
        .focus()
        .select();

    $('#tabs')
        .tabs({
            select: function (evt, ui) {
                if (ui.index === 2 && $('#changelog').children().length === 0) {
                    $.get(chrome.extension.getURL('/CHANGELOG.md'), function (data) {
                        $('#changelog').html(new Showdown.converter().makeHtml(data));
                    });
                } else if (ui.index === 3 && $('#credits').data('running') === false) {
                    window.setTimeout(startCredits, 500);
                }
            }
        })
        .show(); // delayed show so that we don't see how the tabs are build

    // just a graphical gimmick ;-)
    window.setTimeout(function () {
        $('header img')
            .css('visibility', 'visible')
            .show('slide', {direction: 'up'}, 400);
    }, 300);
}());
