/*jslint browser: true, strict: true, indent: 4 */
/*global window, XMLHttpRequest, escape, console*/
(function (window) {
    "use strict";

    /**
     * new SABapi(host, apiKey)
     * creates SABapi object with API key authentication method
     *
     * new SABapi(host, username, password)
     * creates SABapi object with username/password authentication method
     */
    var SABapi = function (host, apiKeyOrUsername, password) {
        this._host = null;
        this._authMethod = "apikey";
        this._apiKey = null;
        this._username = null;
        this._password = null;

        /**
         * @param params Object properties get translated into URL parameters
         * @param callback function(success, response)
         */
        this._request = function (params, callback) {
            if (typeof params !== "object") {
                callback(false, null);
                return;
            }

            if (this._authMethod === "apikey") {
                params.apikey = this._apiKey;
            } else {
                params.ma_username = this._username;
                params.ma_password = this._password;
            }

            var prop, query;
            for (prop in params) {
                query ? query += "&" : query = "?";
                query += prop + "=" + escape(params[prop]);
            }

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        // TODO: API seems to always return 200 even if there was an error. We need to check response text.
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

        /**
         * authMethod === "apikey" || "login"
         */
        this.setAuthMethod = function (authMethod) {
            if (authMethod === "apikey" || authMethod === "login") {
                this._authMethod = authMethod;
            }
        };

        this.setAPIKey = function (apiKey) {
            this._apiKey = apiKey;
        };

        this.setUsername = function (username) {
            this._username = username;
        };

        this.setPassword = function (password) {
            this._password = password;
        };

        this.sendLink = function (link, name, callback) {
            // TODO: reponseText should contain "ok"
            this._request({mode: "addurl", name: link, nzbname: name},
                callback);
        };

        this.verifyConnection = function (callback) {
            // TODO: This method could also check if the desired auth method is accepted by SABnzbd
            // see /api?mode=auth
            this._request({mode: "queue", output: "json"}, function (success, responseText) {
                if (success) {
                    var result = eval("(" + responseText + ")"); // TODO: Improve this!
                    if (result.status === false) {
                        callback(false, responseText);
                    } else {
                        callback(true, responseText);
                    }
                } else {
                    callback(false, responseText);
                }
            });
        };

        if (host !== undefined) {
            this.setHost(host);
        }

        if (apiKeyOrUsername !== undefined && password !== undefined) {
            this.setAuthMethod("login");
            this.setUsername(apiKeyOrUsername);
            this.setPassword(password);
        } else if (apiKeyOrUsername !== undefined) {
            this.setAuthMethod("apikey");
            this.setAPIKey(apiKeyOrUsername);
        }
    };

    window.SABapi = SABapi;
}(window));
