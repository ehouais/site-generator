var fs = require('fs-extra');
var path = require('path');
var ejs = require('ejs');
var ncp = require('ncp').ncp;
var request = require('request');
var marked = require('marked');

var siteDir = '../ehouais.github.io';
var templatesDir = './templates';

var rmdirThen = function(dir, then) {
        var next = function() {
                fs.mkdirSync(dir);
                then && then();
            };

        if (fs.existsSync(dir)) {
            fs.remove(dir, function(err) {
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
        return '//cdn.rawgit.com/'+path;
    };
var datalib = 'ehouais/js-data-libs/v0.5.0';
var uiutilslib = 'ehouais/js-ui-utils/v0.4.0';

// pages
var pagesDir = siteDir+'/pages';
rmdirThen(pagesDir, function() {
    // charts
    var chartsDir = pagesDir+'/charts';
    var chartTemplate = templatesDir+'/chart.ejs';
    var chartslib = 'ehouais/charts/v0.3.1';
    rmdirThen(chartsDir, function() {
        var libs = {
                d3: {url: cdnjs('/d3/4.2.8/d3.min')},
                leaflet: {url: cdnjs('/leaflet/1.0.3/leaflet')},
                'snap.svg': {url: cdnjs('/snap.svg/0.5.1/snap.svg-min')},
                tabletop: {url: cdnjs('/tabletop.js/1.5.2/tabletop.min')},
                timescale: {url: rawgit(chartslib+'/timescale')},
                twopassresize: {url: rawgit(chartslib+'/twopassresize')},
                datatable: {url: rawgit(datalib+'/datatable')},
            };
        var charts = {
                diagram: {
                    stylesheets: ['../condensed-font.css'],
                    requirements: ['snap.svg', 'twopassresize', 'tabletop'],
                    exports: {ext_parser: 'parser'}
                },
                hbars: {
                    stylesheets: ['../condensed-font.css', 'default.css'],
                    requirements: ['d3', 'twopassresize', 'datatable', 'tabletop']
                },
                lines: {
                    stylesheets: ['../condensed-font.css', 'default.css'],
                    requirements: ['d3', 'timescale', 'twopassresize', 'datatable', 'tabletop']
                },
                map: {
                    stylesheets: ['/leaflet/1.0.3/leaflet.css', 'default.css'],
                    requirements: ['leaflet', 'datatable', 'tabletop']
                },
                pie: {
                    stylesheets: ['../condensed-font.css', 'default.css'],
                    requirements: ['d3', 'twopassresize', 'datatable', 'tabletop']
                },
                timeline: {
                    stylesheets: ['../condensed-font.css', 'default.css'],
                    requirements: ['d3', 'timescale', 'twopassresize', 'tabletop'],
                    exports: {ext_parser: 'parser'}
                },
                vbars: {
                    stylesheets: ['../condensed-font.css', 'default.css'],
                    requirements: ['d3', 'twopassresize', 'datatable', 'tabletop']
                }
            };

        fs.readFile(chartTemplate, 'utf8', function(err, data) {
            if (err) { console.log(err); return false }
            var template = ejs.compile(data, {filename: 'dummy'});

            props(charts, function(id, chart) {
                var html;

                var config = {
                        baseUrl: rawgit(chartslib+'/'+id),
                        paths: {
                            http: rawgit(datalib+'/http'),
                            text: cdnjs('/require-text/2.0.12/text.min'),
                            'gist-fs': rawgit(datalib+'/gist-fs'),
                            'on-demand': rawgit(datalib+'/on-demand'),
                            crypto: rawgit(datalib+'/crypto'),
                            sjcl: cdnjs('/sjcl/1.0.6/sjcl.min'),
                        },
                        shim: {
                            sjcl: {
                                exports: 'sjcl'
                            }
                        }
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
                    type: id,
                    dbGistIdStorageId: dbGistIdStorageId,
                    cipherKeyStorageId: cipherKeyStorageId,
                    githubPwdStorageId: githubPwdStorageId
                });

                fs.writeFile(chartsDir+'/'+id+'.html', html, function(err) {
                    if (err) { console.log(err); return false }
                    return true;
                });
            });
        });
    });

    // webviews
    var webviewTemplate = templatesDir+'/webview.ejs';
    var webviewslib = 'ehouais/webviews/v0.5.0';
    (function() {
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
                    url: rawgit(uiutilslib+'/ui-utils')
                }
            };
        var webviews = {
                dashboard: 'index',
                notepad: 'index',
                tabs: {
                    stylesheets: ['style.css'],
                    requirements: ['ui-utils']
                },
                todos: 'index',
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
            };

        fs.readFile(webviewTemplate, 'utf8', function(err, data) {
            if (err) { console.log(err); return false }
            var template = ejs.compile(data, {filename: 'dummy'});

            props(webviews, function(id, webview) {
                var html;

                if (id == 'notepad' || id == 'dashboard' || id == 'todos') {
                    ejs.renderFile(templatesDir+'/webviews.ejs', {
                        dbGistIdStorageId: dbGistIdStorageId,
                        cipherKeyStorageId: cipherKeyStorageId,
                        githubPwdStorageId: githubPwdStorageId
                    }, {}, function(err, str) {
                        request('https://raw.githubusercontent.com/'+webviewslib+'/'+id+'/index.html', function (error, response, body) {
                            if (error) { console.log(error); return false }
                            html = body.replace('<script src="../webviews.js"></script>', str)
                            fs.writeFile(pagesDir+'/'+id+'.html', html, function(err) {
                                if (err) { console.log(err); return false }
                                return true;
                            });
                        });
                    });
                } else if (webview == 'index') {
                    request('https://raw.githubusercontent.com/'+webviewslib+'/'+id+'/index.html', function (error, response, body) {
                        if (error) { console.log(error); return false }
                        html = body
                            .replace(/\/cdn(\/[^'"]+)('|")/g, function(match, path, delimiter) {
                                if (path.indexOf('js-data-libs') != -1 || path.indexOf('js-ui-utils') != -1) {
                                    return rawgit(path.replace('/0.', '/v0.'))+delimiter;
                                } else {
                                    return cdnjs(path)+delimiter;
                                }
                            });
                        fs.writeFile(pagesDir+'/'+id+'.html', html, function(err) {
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
                                sjcl: cdnjs('/sjcl/1.0.6/sjcl.min'),
                                'gist-fs': rawgit(datalib+'/gist-fs'),
                                'on-demand': rawgit(datalib+'/on-demand'),
                                crypto: rawgit(datalib+'/crypto')
                            },
                            shim: {
                                sjcl: {
                                    exports: 'sjcl'
                                }
                            }
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
                        config: config,
                        type: id,
                        dbGistIdStorageId: dbGistIdStorageId,
                        cipherKeyStorageId: cipherKeyStorageId,
                        githubPwdStorageId: githubPwdStorageId
                    });

                    fs.writeFile(pagesDir+'/'+id+'.html', html, function(err) {
                        if (err) { console.log(err); return false }
                        return true;
                    });
                }
            });
        });
    })();

    // js1k
    var js1kDir = pagesDir+'/js1k';
    var js1kTemplate = templatesDir+'/js1k.ejs';
    var js1klib = 'ehouais/js1k/6470cd8';
    rmdirThen(js1kDir, function() {
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

                fs.writeFile(js1kDir+'/'+id+'.html', html, function(err) {
                    if (err) { console.log(err); return false }
                    return true;
                });
            });
        });
    });
});

// apps
// playground, selfservice, page generator ?
/*var appsDir = siteDir+'/apps';
rmdirThen(appsDir);*/

// posts
var postsDir = siteDir+'/posts',
    postTemplate = templatesDir+'/post.ejs',
    postSource = 'https://raw.githubusercontent.com/ehouais/blog-posts/dev-demos',
    getAllMatches = function(regx, string) {
        var match,
            matches = [];

        while (match = regx.exec(string)) {
            matches.push(match);
        }
        return matches
    };
rmdirThen(postsDir, function() {
    fs.readFile(postTemplate, 'utf8', function(err, data) {
        var template = ejs.compile(data);
        request(postSource+'/index.md', function (error, response, md) {
            if (error) { console.log(error); return false }
            var nav = marked(md);

            getAllMatches(RegExp('href="(/[^"]+)?(/[^/]+)"', 'g'), nav).forEach(function(match) {
                var path = match[1] || '',
                    filepath = path+match[2];
                request(postSource+filepath+'.md', function (error, response, md) {
                    if (path) {
                        fs.ensureDirSync(postsDir+path);
                    }
                    fs.writeFileSync(postsDir+filepath+'.html', template({
                        nav: nav.replace(RegExp('href="/([0-9]{4})/', 'g'), 'href="/posts/$1/'),
                        post: marked(md)
                            .replace(RegExp('href="/([0-9]{4})/', 'g'), 'href="/posts/$1/')
                            .replace(RegExp('/cdn/', 'g'), '/assets/')
                            .replace(RegExp('//ehouais.net/blog/wp-content/uploads/[^"]+/', 'g'), '/assets/img/')
                    }));
                });
            });
        });
    });
});

// database
var dbTemplate = templatesDir+'/db.ejs';
var dbGistIdStorageId = 'dbGistId';
var githubPwdStorageId = 'githubPwd';
var dbFile = siteDir+'/db.html';
var cipherKeyStorageId = 'cipherKey';
fs.readFile(dbTemplate, 'utf8', function(err, data) {
    fs.writeFile(dbFile, ejs.render(data, {
        dbGistIdStorageId: dbGistIdStorageId,
        cipherKeyStorageId: cipherKeyStorageId,
        githubPwdStorageId: githubPwdStorageId
    }), function(err) {
        if (err) { console.log(err); return false }
        return true;
    });
});

// 404.html
var notfoundTemplate = templatesDir+'/404.ejs';
var notfoundFile = siteDir+'/404.html';
fs.readFile(notfoundTemplate, 'utf8', function(err, data) {
    fs.writeFile(notfoundFile, data, function(err) {
        if (err) { console.log(err); return false }
        return true;
    });
});

// Assets
var assetsDir = siteDir+'/assets';
console.log('Copying assets...');
fs.copySync('assets', assetsDir);
