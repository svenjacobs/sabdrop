#!/usr/bin/env node
/*jslint white: true, plusplus: true, nomen: true, indent: 4*/
/*global require, console*/

/**
 * node.js based build script for static web pages, Google Chrome extensions etc.
 * which parses a directory structure, runs checks and compilations/minifications
 * on JavaScript and CSS files and finally creates a packaged version of the web
 * app in an output directory.
 *
 * Non-standard dependencies:
 *   - underscore (1.3.0)
 *   - underscore.string (2.0.0)
 *
 * @author Sven Jacobs <mail@svenjacobs.com>
 */
(function() {
    'use strict';

    var _ = require('underscore'),
        fs = require('fs'),
        path = require('path'),
        http = require('http'),
        qs = require('querystring'),
        lint = require('./build/jslint.js');

    _.str = require('underscore.string');
    _.mixin(_.str.exports());

    /**
     * Constructor of BuildJS.
     *
     * @param source The source dir
     * @param destination The destination/output dir
     * @param ignore Optionally an array of relative paths as seen from the source
     *               dir which are ignored for JavaScript/CSS validation. However
     *               these files/folders are still copied.
     *               For example: ['js/3rdparty', 'js/badcode.js']
     */
    function BuildJS(source, destination, ignore) {
        this.source = source;
        this.destination = destination;
        this.ignore = ignore !== undefined ? ignore : [];
    }

    /**
     * Runs the build process.
     */
    BuildJS.prototype.run = function() {
        this.dir(this.source);
    };

    /**
     * Iterates over directory structure.
     *
     * @private
     */
    BuildJS.prototype.dir = function(dir) {
        fs.readdir(dir, this.e(function(files) {
            files.forEach(function(file) {
                // Ignore files/directories starting with a .
                if (_(file).startsWith('.')) {
                    return;
                }

                var joined = path.join(dir, file);

                fs.stat(joined, this.e(function(stats) {
                    if (stats.isDirectory()) {
                        this.dir(joined);
                    } else if (stats.isFile()) {
                        this.file(joined);
                    }
                }));
            }, this);
        }));
    };

    /**
     * @private
     */
    BuildJS.prototype.file = function(file) {
        if (this.matchIgnored(file)) {
            return;
        }

        switch (path.extname(file)) {
            case '.js':
                this.javascript(file);
            break;

            case '.css':
            break;
        }
    };

    /**
     * @private
     */
    BuildJS.prototype.javascript = function(file) {
        console.log('=== Running JSLint on ' + file + ' ===\n');
        var content = fs.readFileSync(file, 'utf-8'),
            result = lint.JSLINT(content);
        //overall &= result;
        if (!result) {
            lint.JSLINT.errors.forEach(function(err) {
                console.log('    line: ' + err.line);
                console.log('    character: ' + err.character);
                console.log('    reason: ' + err.reason + '\n');
            });
        } else {
            console.log('    OK\n');
        }
    };

    /**
     * Applys Google Closure Compiler on JavaScript file.
     *
     * @param callback function(closureResponse)
     *                 closureResponse is an object, see http://code.google.com/closure/compiler/docs/api-ref.html 
     *
     * @private
     */
    BuildJS.prototype.closure = function(file, callback) {
        fs.readFile(file, 'utf8', this.e(function(contents) {
            var body = qs.stringify({
                    js_code: contents,
                    compilation_level: 'SIMPLE_OPTIMIZATIONS',
                    output_format: 'json',
                    output_info: 'compiled_code'
                }),

                req = http.request({
                    host: 'closure-compiler.appspot.com',
                    path: '/compile',
                    method: 'POST',
                    headers: {
                        'Content-Length': body.length,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }, function(res) {
                    var data = '';

                    res.setEncoding('utf8');

                    res.on('data', function(chunk) {
                        data += chunk;
                    });

                    res.on('end', function() {
                        var json = JSON.parse(data);
                        callback(data);
                    });
                }
            );

            req.on('error', function(err) {
                console.error(err);
            });

            req.end(body);
        }));
    };

    /**
     * @private
     */
    BuildJS.prototype.matchIgnored = function(file) {
        var self = this;
        return _.find(this.ignore, function(item) {
            return _(file).startsWith(path.normalize(item))
                || _(file).startsWith(path.join(self.source, item));
        }) !== undefined;
    };

    /**
     * Creates a generic callback function that handles errors.
     *
     * Returned function assumes that first argument is the error object
     * as is the case with fs.readdir() for example.
     *
     * @private
     */
    BuildJS.prototype.e = function(callback) {
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

    var build = new BuildJS('src', 'out', ['js/lib']);
    //build.run();

    build.closure('src/js/background.js');

    /*var fs = require('fs'),
        lint = require('./build/jslint.js'),
        DIR = 'src/js';

    fs.readdir(DIR, function (err, files) {
        if (err) {
            console.error(err);
        } else {
            var overall = true;
            files.forEach(function (file) {
                var path = DIR + '/' + file;
                var stats = fs.statSync(path);
                if (stats.isFile() && /\.js$/.test(file)) {
                    console.log('=== Running JSLint on ' + path + ' ===\n');
                    var content = fs.readFileSync(path, 'utf-8');
                    var result = lint.JSLINT(content);
                    overall &= result;
                    if (!result) {
                        lint.JSLINT.errors.forEach(function (err) {
                            console.log('    line: ' + err.line);
                            console.log('    character: ' + err.character);
                            console.log('    reason: ' + err.reason + '\n');
                        });
                    } else {
                        console.log('    OK\n');
                    }
                }
            });

            if (overall) {
                console.log('All OK. You rock!');
            }
        }
    });*/
}());

