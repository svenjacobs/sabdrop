/*jslint browser: true, indent: 4 */
/*global window*/
(function () {
    "use strict";

    window.SABdrop = {
        Common: {
            truncate: function (text, maxLength) {
                maxLength = maxLength || 40;

                if (text.length > maxLength + 3) {
                    var front = text.substring(0, maxLength / 2);
                    var end = text.substring(text.length - maxLength / 2, text.length);
                    text = front + "..." + end;
                }
                return text;
            },

            basename: function (name) {
                return (/\/([^\/]+)$/.exec(name) || [null, null])[1];
            }
        }
    };
}());
