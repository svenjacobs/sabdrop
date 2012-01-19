/*jslint browser: true, indent: 4 */
/*global $, chrome*/
(function () {
    "use strict";

    var countdown = 10,
        interval = null,
        data = JSON.parse(window.location.hash.substr(1));

    function submit() {
        var name = $("#name").val();

        if (name === undefined || name === null || name === "") {
            name = data.basename;
        }

        chrome.extension.sendRequest({
            action: "downloadLink",
            link: data.link,
            category: data.category,
            name: name
        });

        window.close();
    }

    function abortCountdown() {
        if (interval !== null) {
            $("#countdown").hide();
            window.clearInterval(interval);
            interval = null;
        }
    }

    $("#url").html(data.link);

    $("#name")
        .val(data.basename)
        .click(function (evt) {
            if (this.value === data.basename) {
                evt.stopPropagation();
                this.select();
            }
        })
        .keydown(function (evt) {
            if (evt.which === 13) {
                submit();
            }
        });

    $("#submit").click(submit);

    $("#countdown").text(countdown);

    $(window).focus(abortCountdown);

    interval = window.setInterval(function () {
        countdown -= 1;

        var c = $("#countdown");
        c.text(countdown);

        if (countdown === 5) {
            c.addClass("warning");
        } else if (countdown === 0) {
            submit();
        }
    }, 1000);

}());
