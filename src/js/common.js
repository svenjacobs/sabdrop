/*jshint browser: true, regexp: false, indent: 4 */
/*global window*/
(function () {
    'use strict';

    var prefixes = {
        decimal: [
            [Math.pow(10, 12), 'TB'],
            [Math.pow(10, 9), 'GB'],
            [Math.pow(10, 6), 'MB'],
            [Math.pow(10, 3), 'kB'],
            [0, 'B']
        ],
        binary: [
            [Math.pow(2, 40), 'TiB'],
            [Math.pow(2, 30), 'GiB'],
            [Math.pow(2, 20), 'MiB'],
            [Math.pow(2, 10), 'KiB'],
            [0, 'B']
        ]
    };

    window.SABdrop = {
        Common: {
            truncate: function (text, maxLength) {
                maxLength = maxLength || 40;

                if (text.length > maxLength + 3) {
                    var front = text.substring(0, maxLength / 2),
                        end = text.substring(text.length - maxLength / 2, text.length);
                    text = front + '...' + end;
                }
                return text;
            },

            basename: function (name) {
                return (/\/([^\/]+)$/.exec(name) || [null, null])[1];
            },

            humanizeBytes: function (bytes, decimalPrefixes) {
                var result;

                try {
                    (decimalPrefixes ? prefixes.decimal : prefixes.binary).forEach(function (p) {
                        if (bytes >= p[0]) {
                            result = [bytes / p[0], p[1]];
                            throw 'break';
                        }
                    });
                } catch (e) {
                    if (e !== 'break') {
                        throw e;
                    }
                }

                return result;
            }
        }
    };
}());
