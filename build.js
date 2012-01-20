#!/usr/bin/env node
/*jslint white: true, plusplus: true, nomen: true, indent: 4*/
/*global require, console*/

/**
 * node.js script that will torture all files from /js through a JSLint verification.
 */
(function() {
    "use strict";

    function Build() {
        this.fs = require("fs");
        this.path = require("path");
        //this._s = require("underscore.string");
    }

    /**
     * Runs the build process.
     *
     * @param path The source path
     * @param output The output/destination path
     */
    Build.prototype.run = function(path, output) {
        this.errors = [];
        this.dir(path, output);
    };

    /**
     * Iterates over directory structure.
     *
     * @private
     */
    Build.prototype.dir = function(path, output) {
        this.fs.readdir(path, this.e(function(files) {
            files.forEach(function(file) {
                // Ignore files/directories starting with a .
                if (file[0] === ".") {
                    return;
                }

                var p = this.path.join(path, file);

                this.fs.stat(p, this.e(function(stats) {
                    if (stats.isDirectory()) {
                        this.dir(p, output);
                    } else if (stats.isFile()) {
                        this.file(p, output);
                    }
                }));
            }, this);
        }));
    };

    /**
     * @private
     */
    Build.prototype.file = function(file, output) {
        // TODO
    };

    /**
     * Creates a generic callback function that handles errors.
     *
     * Returned function assumes that first argument is the error object
     * as is the case with fs.readdir() for example.
     *
     * @private
     */
    Build.prototype.e = function(callback) {
        var self = this;
        return function() {
            var args = [],
                err = arguments['0'],
                i;

            if (err) {
                console.error(err);
                this.errors.push(err);
            } else {
                // arguments is an object not an array so we need to convert it
                for (i = 1; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }

                callback.apply(self, args);
            }
        };
    };

    var build = new Build();

    build.run(".", ".");


    /*var fs = require("fs"),
        lint = require("./build/jslint.js"),
        DIR = "src/js";

    fs.readdir(DIR, function (err, files) {
        if (err) {
            console.error(err);
        } else {
            var overall = true;
            files.forEach(function (file) {
                var path = DIR + "/" + file;
                var stats = fs.statSync(path);
                if (stats.isFile() && /\.js$/.test(file)) {
                    console.log("=== Running JSLint on " + path + " ===\n");
                    var content = fs.readFileSync(path, "utf-8");
                    var result = lint.JSLINT(content);
                    overall &= result;
                    if (!result) {
                        lint.JSLINT.errors.forEach(function (err) {
                            console.log("    line: " + err.line);
                            console.log("    character: " + err.character);
                            console.log("    reason: " + err.reason + "\n");
                        });
                    } else {
                        console.log("    OK\n");
                    }
                }
            });

            if (overall) {
                console.log("All OK. You rock!");
            }
        }
    });*/
}());

