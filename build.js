#!/usr/bin/env node
// node.js script that will torture all files from /js through a JSLint verification.

(function () {
    "use strict";

    var fs = require("fs"),
        lint = require("./js/lib/jslint.js"),
        DIR = "js";

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
    });
}());

