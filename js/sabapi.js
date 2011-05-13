/*jslint browser: true, strict: true, indent: 4 */
/*global window, XMLHttpRequest*/
(function (window) {
    "use strict";

    var SABapi = function (host, apiKey) {
        this._host = null;
        this._apiKey = null;

        /**
         * @param params Object properties get translated into URL parameters
         * @param callback function(success, response)
         */
        this._request = function(params, callback) {
            if (typeof params !== "object") {
                callback(false, null);
                return;
            }

            var prop, query;
            params.apikey = this._apiKey;
            for (prop in params) {
                query ? query += "&" : query = "?";
                query += prop + "=" + escape(params[prop]);
            }

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        callback(true, xhr.responseText);
                    } else {
                        callback(false, xhr.responseText);
                    }
                }
            };

            xhr.onerror = function (e) {
                console.error(e);
                callback(false, xhr.responseText);
            };

            xhr.open("GET", this._host + "api" + query, true);
            xhr.send();
        };

        this.setHost = function (host) {
            if (!/\/$/.exec(host)) {
                host += "/";
            }
            this._host = host;
        };

        this.setAPIKey = function (apiKey) {
            this._apiKey = apiKey;
        };

        this.sendLink = function (link, name, callback) {
            this._request({mode: "addurl", name: link, nzbname: name},
                callback);
        };

        this.verifyConnection = function (callback) {
            this._request({mode: "version", output: "json"},
                callback);
        };

        if (host) {
            this.setHost(host);
        }

        if (apiKey) {
            this.setAPIKey(apiKey);
        }
    };

    window.SABapi = SABapi;
}(window));
