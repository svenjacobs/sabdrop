/*jslint browser: true, indent: 4 */
/*global $, chrome, SABdrop*/
(function () {
    "use strict";

    var data = null;

    function buildList(data) {
        $("#downloads ul").empty();

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
                            var cat = null;
                            if ($("#categories").is(":visible")) {
                                cat = $("#categories").val();
                            }
                            chrome.extension.sendRequest({
                                action: "downloadLink",
                                link: $(this).data("link"),
                                category: cat
                            });
                        })
                );
            }
        });
    }

    function filter() {
        if (data === null) {
            return;
        }

        var term = $(this).val().toLowerCase();
        if (term === "") {
            buildList(data);
        } else {
            var filtered = [];
            $.each(data, function (index, item) {
                if (item.toLowerCase().indexOf(term) >= 0) {
                    filtered.push(item);
                }
            });
            buildList(filtered);
        }
    }

    chrome.tabs.getSelected(null, function (tab) {
        data = chrome.extension.getBackgroundPage().pageActionData[tab.id];
        buildList(data);
    });

    // fill categories dropdown
    chrome.extension.sendRequest({action: "getCategories"}, function (categories) {
        if (categories === null || categories.length === 0) {
            return;
        }

        var select = $("#categories");

        select.append(
            $("<option>")
                .html(chrome.i18n.getMessage("context_menu_nocategory"))
                .val("")
        );

        $.each(categories, function (index, cat) {
            select.append(
                $("<option>")
                    .html(cat)
                    .val(cat)
            );
        });

        select.show();
    });

    $("#filter")
        .prop("placeholder", chrome.i18n.getMessage("filter_results"))
        .keyup(filter)
        .change(filter)
        .click(filter);
}());
