var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var ejs = require('ejs');
var ncp = require('ncp').ncp;
var request = require('request');

var chartTemplate = 'chart-template.ejs';
var webviewTemplate = 'webview-template.ejs';
var js1kTemplate = 'js1k-template.ejs';
var destChartsDir = '../ehouais.github.io/demos/charts';
var destWebviewsDir = '../ehouais.github.io/demos/webviews';
var destJs1kDir = '../ehouais.github.io/demos/js1k';
var destPlaygroundDir = '../ehouais.github.io/demos/playground';
var destPostsDir = '../ehouais.github.io/posts';

var rmdirThen = function(dir, then) {
        var next = function() {
                if (then) {
                    fs.mkdirSync(dir);
                    then();
                }
            };

        if (fs.existsSync(dir)) {
            rimraf(dir, function(err) {
                next();
            });
        } else {
            next();
        }
    };
var props = function(obj, cb) {
        Object.keys(obj).forEach(function(key) {
            cb(key, obj[key]);
        });
    };
var cdnjs = function(path) {
        return '//cdnjs.cloudflare.com/ajax/libs'+path;
    };
var rawgit = function(path) {
        return '//cdn.rawgit.com/ehouais'+path;
    };
var chartslib = '/charts/v0.3.1';
var webviewslib = '/webviews/v0.3.0';
var js1klib = '/js1k/6470cd8';
var datalib = '/js-data-libs/v0.3.0';

rmdirThen(destChartsDir, function() {
    var libs = {
            d3: {url: cdnjs('/d3/4.2.8/d3.min')},
            leaflet: {url: cdnjs('/leaflet/1.0.3/leaflet')},
            'snap.svg': {url: cdnjs('/snap.svg/0.5.1/snap.svg-min')},
            timescale: {url: rawgit(chartslib+'/timescale')},
            twopassresize: {url: rawgit(chartslib+'/twopassresize')},
            datatable: {url: rawgit(datalib+'/datatable')},
        };
    var charts = {
            diagram: {
                stylesheets: ['../condensed-font.css'],
                requirements: ['snap.svg', 'twopassresize'],
                exports: {ext_parser: 'parser'}
            },
            hbars: {
                stylesheets: ['../condensed-font.css', 'default.css'],
                requirements: ['d3', 'twopassresize', 'datatable']
            },
            lines: {
                stylesheets: ['../condensed-font.css', 'default.css'],
                requirements: ['d3', 'timescale', 'twopassresize', 'datatable']
            },
            map: {
                stylesheets: ['/leaflet/1.0.3/leaflet.css', 'default.css'],
                requirements: ['leaflet', 'datatable']
            },
            pie: {
                stylesheets: ['../condensed-font.css', 'default.css'],
                requirements: ['d3', 'twopassresize', 'datatable']
            },
            timeline: {
                stylesheets: ['../condensed-font.css', 'default.css'],
                requirements: ['d3', 'timescale', 'twopassresize'],
                exports: {ext_parser: 'parser'}
            },
            vbars: {
                stylesheets: ['../condensed-font.css', 'default.css'],
                requirements: ['d3', 'twopassresize', 'datatable']
            }
        };

    fs.readFile(chartTemplate, 'utf8', function(err, data) {
        if (err) { console.log(err); return false }
        var template = ejs.compile(data);

        props(charts, function(id, chart) {
            var html;

            var config = {
                    baseUrl: rawgit(chartslib+'/'+id),
                    paths: {
                        http: rawgit(datalib+'/http'),
                        text: cdnjs('/require-text/2.0.12/text.min')
                    },
                    shim: {}
                };

            (chart.requirements || []).forEach(function(require) {
                var info = libs[require];
                config.paths[require] = info.url;
                if (info.exports) {
                    config.shim[require] = {exports: info.exports};
                }
            });
            props(chart.exports || {}, function(id, exp) {
                config.shim[id] = {exports: exp};
            });

            html = template({
                stylesheets: chart.stylesheets.map(function(path) {
                    return path.substr(0, 2) == '//' ? cdnjs(path) : rawgit(chartslib+'/'+id+'/'+path);
                }),
                config: config,
                type: id
            });

            fs.writeFile(destChartsDir+'/'+id+'.html', html, function(err) {
                if (err) { console.log(err); return false }
                return true;
            });
        });
    });
});
rmdirThen(destWebviewsDir, function() {
    var libs = {
            jsontree: {
                url: cdnjs('/jsontree/0.2.1/jsontree'),
                exports: 'JSONTree'
            },
            tablesort: {
                url: cdnjs('/tablesort/5.0.0/tablesort.min'),
                exports: 'Tablesort'
            },
            'ui-utils': {
                url: rawgit('/js-ui-utils/0.2.0/ui-utils')
            }
        };
    var webviews = {
            'dashboard': 'index',
            'forms': 'index',
            'notepad': 'index',
            'tabs': 'index',
            'todos': 'index',
            'object-tree': {
                stylesheets: ['style.css'],
                requirements: ['jsontree']
            },
            table: {
                stylesheets: ['style.css'],
                requirements: ['tablesort']
            },
            text: {
                stylesheets: ['style.css']
            },
            tracker: {
                stylesheets: ['/twitter-bootstrap/3.3.7/css/bootstrap.min.css', 'style.css'],
                requirements: ['ui-utils']
            },
        };

    fs.readFile(webviewTemplate, 'utf8', function(err, data) {
        if (err) { console.log(err); return false }
        var template = ejs.compile(data);

        props(webviews, function(id, webview) {
            var html;

            if (webview == 'index') {
                request('https:'+rawgit(webviewslib+'/'+id+'/index.html'), function (error, response, body) {
                    if (err) { console.log(err); return false }
                    html = body
                        .replace('../webviews.js', rawgit(webviewslib+'/webviews.js'))
                        .replace('../forms/', '../webviews/forms.html')
                        .replace(/\/cdn(\/[^'"]+)('|")/g, function(match, path, delimiter) {
                            if (path.indexOf('js-data-libs') != -1 || path.indexOf('js-ui-utils') != -1) {
                                return rawgit(path.replace('/0.', '/v0.'))+delimiter;
                            } else {
                                return cdnjs(path)+delimiter;
                            }
                        });
                    fs.writeFile(destWebviewsDir+'/'+id+'.html', html, function(err) {
                        if (err) { console.log(err); return false }
                        return true;
                    });
                });
            } else {
                var config = {
                        baseUrl: rawgit(webviewslib+'/'+id),
                        paths: {
                            http: rawgit(datalib+'/http'),
                            text: cdnjs('/require-text/2.0.12/text.min'),
                            jquery: cdnjs('/jquery/3.1.0/jquery.min'),
                            sjcl: cdnjs('/sjcl/1.0.6/sjcl.min'),
                            webviews: rawgit(webviewslib+'/webviews')
                        },
                        shim: {}
                    };

                (webview.requirements || []).forEach(function(require) {
                    var info = libs[require];
                    config.paths[require] = info.url;
                    if (info.exports) {
                        config.shim[require] = {exports: info.exports};
                    }
                });
                props(webview.exports || {}, function(id, exp) {
                    config.shim[id] = {exports: exp};
                });

                html = template({
                    stylesheets: webview.stylesheets.map(function(path) {
                        return path.substr(0, 2) == '//' ? cdnjs(path) : rawgit(webviewslib+'/'+id+'/'+path);
                    }),
                    config: config
                });

                fs.writeFile(destWebviewsDir+'/'+id+'.html', html, function(err) {
                    if (err) { console.log(err); return false }
                    return true;
                });
            }
        });
    });
});
rmdirThen(destJs1kDir, function() {
    fs.readFile(js1kTemplate, 'utf8', function(err, data) {
        if (err) { console.log(err); return false }
        var template = ejs.compile(data);

        [
            '2012-Mine[love]craft',
            '2013-Strange_crystals_II',
            '2014-Buggy_island',
            '2015-Islands',
            '2016-Gliese_581_c'
        ].forEach(function(id) {
            html = template({
                demo: id,
                url: rawgit(js1klib+'/'+id+'/plain.js')
            });

            fs.writeFile(destJs1kDir+'/'+id+'.html', html, function(err) {
                if (err) { console.log(err); return false }
                return true;
            });
        });
    });
});
rmdirThen(destPlaygroundDir);
rmdirThen(destPostsDir);
