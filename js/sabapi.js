/*jslint browser: true, strict: true, indent: 4 */
/*global window, XMLHttpRequest, JSON, escape, console*/
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
         * @param callback A function(success, response)
         * @param noAuth If true, no authentication parameters will be appended to query
         */
        this._request = function (params, callback, noAuth) {
            if (typeof params !== "object") {
                callback(false, null);
                return;
            }

            if (!noAuth) {
                if (this._authMethod === "apikey") {
                    params.apikey = this._apiKey;
                } else {
                    params.ma_username = this._username;
                    params.ma_password = this._password;
                }
            }

            var prop, query;
            for (prop in params) {
                if (params.hasOwnProperty(prop)) {
                    if (query) {
                        query += "&";
                    } else {
                        query = "?";
                    }
                    query += prop + "=" + escape(params[prop]);
                }
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
            if (!/\/$/.test(host)) {
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

        /**
         * Send URL to SABnzbd for download.
         *
         * @param link URL
         * @param name Name for that item in download queue
         * @param category Category. Can be null or empty string (== no category)
         * @param callback A function(success, responseText)
         */
        this.sendLink = function (link, name, category, callback) {
            var params = {mode: "addurl", name: link, nzbname: name};
            if (category !== null && category !== "") {
                params.cat = category;
            }

            this._request(params, function (success, responseText) {
                if (success && responseText.replace(/\n/, "") === "ok") {
                    callback(true, responseText);
                } else {
                    callback(false, responseText);
                }
            });
        };

        this.verifyConnection = function (callback) {
            this._request({mode: "queue", output: "json"}, function (success, responseText) {
                if (success && !/"status":false/.test(responseText)) {
                    callback(true, responseText);
                } else {
                    callback(false, responseText);
                }
            });
        };

        /**
         * Returns remote authentication method.
         * responseText may contain "none", "apikey" or "login".
         *
         * @param callback A function(success, responseText)
         */
        this.remoteAuthMethod = function (callback) {
            this._request({mode: "auth"}, function (success, responseText) {
                callback(success, success ? responseText.replace(/\n/, "").toLowerCase() : responseText);
            }, true);
        };

        /**
         * Gets categories from SABnzbd.
         *
         * @param callback A function(categories) where categories is an array of string
         */
        this.categories = function (callback) {
            this._request({mode: "queue", output: "json"}, function (success, responseText) {
                var filtered = [];

                if (success) {
                    var json = JSON.parse(responseText);
                    var categories = json.queue.categories;

                    if (typeof categories === "object") {
                        categories.forEach(function (c) {
                            if (c !== "*") {
                                filtered.push(c);
                            }
                        });
                    }
                }

                callback(filtered);
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
