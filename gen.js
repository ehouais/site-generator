var fs = require('fs-extra');
var path = require('path');
var ejs = require('ejs');
var ncp = require('ncp').ncp;
var request = require('request');
var marked = require('marked');

var siteDir = '../ehouais.github.io';
var toolsDir = siteDir+'/tools'
var templatesDir = './templates';

var props = function(obj, cb) {
        Object.keys(obj).forEach(function(key) {
            cb(key, obj[key]);
        });
    };
var cdnjs = function(path) {
        return '//cdnjs.cloudflare.com/ajax/libs'+path;
    };
var datalib = 'js-data-libs/v0.5.1';
var uiutilslib = 'js-ui-utils/v0.4.2';

// Start from scratch
console.log('Emptying destination folder...');
fs.readdirSync(siteDir).forEach(function(name) {
    if (name != '.git') {
        fs.removeSync(siteDir+'/'+name);
    }
})

// Assets
var assetsDir = siteDir+'/assets';
var assets = [];
console.log('Copying assets...');
fs.copySync('assets', assetsDir);

var fetchAsset = function(filepath) {
        var url = 'https://raw.githubusercontent.com/ehouais/'+filepath;
        if (assets.indexOf(url) != -1) {
            return;
        }
        assets.push(url);
        console.log('Fetching asset "'+url+'"...');
        request(url, function (error, response, body) {
            if (error) { console.log(error); return false }
            fs.ensureDirSync(path.dirname(assetsDir+'/'+filepath));
            fs.writeFile(assetsDir+'/'+filepath, body, function(err) {
                if (err) { console.log(err); return false }
                return true;
            });
        });
    };

// charts
var chartsDir = toolsDir+'/charts';
var chartTemplate = templatesDir+'/chart.ejs';
var chartslib = 'charts/v0.3.2';
fs.ensureDirSync(chartsDir);
fs.readFile(chartTemplate, 'utf8', function(err, data) {
    if (err) { console.log(err); return false }
    var template = ejs.compile(data, {filename: 'dummy'});
    var libs = {
            d3: cdnjs('/d3/4.2.8/d3.min'),
            leaflet: cdnjs('/leaflet/1.0.3/leaflet'),
            'snap.svg': cdnjs('/snap.svg/0.5.1/snap.svg-min'),
            tabletop: cdnjs('/tabletop.js/1.5.2/tabletop.min'),
            timescale: chartslib+'/timescale',
            twopassresize: chartslib+'/twopassresize',
            datatable: datalib+'/datatable',
        };
    var charts = {
            diagram: {
                stylesheets: ['../condensed-font.css'],
                requirements: ['snap.svg', 'twopassresize', 'tabletop', 'ext_parser'],
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
                requirements: ['d3', 'timescale', 'twopassresize', 'tabletop', 'ext_parser'],
                exports: {ext_parser: 'parser'}
            },
            vbars: {
                stylesheets: ['../condensed-font.css', 'default.css'],
                requirements: ['d3', 'twopassresize', 'datatable', 'tabletop']
            }
        };

    console.log('Generating charts...');
    props(charts, function(id, chart) {
        var html;

        var config = {
                baseUrl: '/assets',
                paths: {
                    http: datalib+'/http',
                    text: cdnjs('/require-text/2.0.12/text.min'),
                    'gist-fs': datalib+'/gist-fs',
                    'on-demand': datalib+'/on-demand',
                    crypto: datalib+'/crypto',
                    sjcl: cdnjs('/sjcl/1.0.6/sjcl.min'),
                    chart: chartslib+'/'+id+'/chart'
                },
                shim: {
                    sjcl: {
                        exports: 'sjcl'
                    }
                }
            };

        fetchAsset(datalib+'/http.js');
        fetchAsset(datalib+'/gist-fs.js');
        fetchAsset(datalib+'/on-demand.js');
        fetchAsset(datalib+'/crypto.js');
        fetchAsset(chartslib+'/'+id+'/chart.js');

        (chart.requirements || []).forEach(function(require) {
            var path = libs[require] || chartslib+'/'+id+'/'+require;
            config.paths[require] = path;
            if (path.substr(0, 2) != '//') {
                fetchAsset(path+'.js');
            }
        });
        props(chart.exports || {}, function(id, exp) {
            config.shim[id] = {exports: exp};
        });

        html = template({
            stylesheets: chart.stylesheets.map(function(filepath) {
                var apath;
                if (filepath.substr(0, 2) == '..') {
                    apath = chartslib+'/'+filepath.substr(3);
                } else {
                    apath = chartslib+'/'+id+'/'+filepath;
                }
                fetchAsset(apath);
                return '/assets/'+apath;
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

// webviews
var webviewTemplate = templatesDir+'/webview.ejs';
var webviewslib = 'webviews/v0.5.0';
(function() {
    var libs = {
            tablesort: {
                url: cdnjs('/tablesort/5.0.0/tablesort.min'),
                exports: 'Tablesort'
            },
            'ui-utils': {
                url: uiutilslib+'/ui-utils'
            }
        };
    var webviews = {
            dashboard: 'index',
            notepad: 'index',
            tabs: {
                stylesheets: ['style.css'],
                requirements: ['ui-utils']
            },
            table: {
                stylesheets: ['style.css'],
                requirements: ['tablesort']
            },
        };

    fs.readFile(webviewTemplate, 'utf8', function(err, data) {
        if (err) { console.log(err); return false }
        var template = ejs.compile(data, {filename: 'dummy'});

        console.log('Generating webviews...');
        fs.ensureDirSync(toolsDir);
        props(webviews, function(id, webview) {
            var html,
                destPath = toolsDir+'/'+id+'.html';

            if (id == 'notepad' || id == 'dashboard') {
                fetchAsset(uiutilslib+'/overlay.js');
                fetchAsset(uiutilslib+'/form.js');
                ejs.renderFile(templatesDir+'/webviews.ejs', {
                    dbGistIdStorageId: dbGistIdStorageId,
                    cipherKeyStorageId: cipherKeyStorageId,
                    githubPwdStorageId: githubPwdStorageId
                }, {}, function(err, str) {
                    var url = 'https://raw.githubusercontent.com/ehouais/'+webviewslib+'/'+id+'/index.html';
                    console.log('Fetching "'+url+'"...');
                    request(url, function (error, response, body) {
                        if (error) { console.log(error); return false }
                        html = body.replace('<script src="../webviews.js"></script>', str)
                        fs.writeFile(destPath, html, function(err) {
                            if (err) { console.log(err); return false }
                            return true;
                        });
                    });
                });
            } else if (webview == 'index') {
                var url = 'https://raw.githubusercontent.com/ehouais/'+webviewslib+'/'+id+'/index.html';
                console.log('Fetching "'+url+'"...');
                request(url, function (error, response, body) {
                    if (error) { console.log(error); return false }
                    html = body
                        .replace(/\/cdn(\/[^'"]+)('|")/g, function(match, path, delimiter) {
                            if (path.indexOf('js-data-libs') != -1 || path.indexOf('js-ui-utils') != -1) {
                                var mpath = path.replace('/0.', '/v0.')+delimiter;
                                fetchAsset(mpath);
                                return mpath;
                            } else {
                                return cdnjs(path)+delimiter;
                            }
                        });
                    fs.writeFile(destPath, html, function(err) {
                        if (err) { console.log(err); return false }
                        return true;
                    });
                });
            } else {
                var config = {
                        baseUrl: '/assets',
                        paths: {
                            http: datalib+'/http',
                            text: cdnjs('/require-text/2.0.12/text.min'),
                            sjcl: cdnjs('/sjcl/1.0.6/sjcl.min'),
                            'gist-fs': datalib+'/gist-fs',
                            'on-demand': datalib+'/on-demand',
                            crypto: datalib+'/crypto',
                            renderer: webviewslib+'/'+id+'/renderer'
                        },
                        shim: {
                            sjcl: {
                                exports: 'sjcl'
                            }
                        }
                    };

                fetchAsset(datalib+'/http.js');
                fetchAsset(datalib+'/gist-fs.js');
                fetchAsset(datalib+'/on-demand.js');
                fetchAsset(datalib+'/crypto.js');
                fetchAsset(webviewslib+'/'+id+'/renderer.js');
        
                (webview.requirements || []).forEach(function(require) {
                    var info = libs[require];
                    config.paths[require] = info.url;
                    if (info.url.substr(0, 2) != '//') {
                        fetchAsset(info.url+'.js');
                    }
                    if (info.exports) {
                        config.shim[require] = {exports: info.exports};
                    }
                });
                props(webview.exports || {}, function(id, exp) {
                    config.shim[id] = {exports: exp};
                });

                html = template({
                    stylesheets: webview.stylesheets.map(function(filepath) {
                        var apath;
                        if (filepath.substr(0, 2) == '..') {
                            apath = webviewslib+'/'+filepath.substr(3);
                        } else {
                            apath = webviewslib+'/'+id+'/'+filepath;
                        }
                        fetchAsset(apath);
                        return '/assets/'+apath;
                    }),
                    config: config,
                    type: id,
                    dbGistIdStorageId: dbGistIdStorageId,
                    cipherKeyStorageId: cipherKeyStorageId,
                    githubPwdStorageId: githubPwdStorageId
                });

                fs.writeFile(destPath, html, function(err) {
                    if (err) { console.log(err); return false }
                    return true;
                });
            }
        });
    });
})();

// js1k
var js1kDir = siteDir+'/js1k';
var js1kTemplate = templatesDir+'/js1k.ejs';
var js1klib = 'js1k/6470cd8';
fs.mkdir(js1kDir, function() {
    fs.readFile(js1kTemplate, 'utf8', function(err, data) {
        if (err) { console.log(err); return false }
        var template = ejs.compile(data);

        console.log('Generating JS1k demos...');
        [
            '2012-Mine[love]craft',
            '2013-Strange_crystals_II',
            '2014-Buggy_island',
            '2015-Islands',
            '2016-Gliese_581_c'
        ].forEach(function(id) {
            var path = js1klib+'/'+id+'/plain.js';
            html = template({
                demo: id,
                url: '/assets/'+path
            });
            fetchAsset(path);

            fs.writeFile(js1kDir+'/'+id+'.html', html, function(err) {
                if (err) { console.log(err); return false }
                return true;
            });
        });
    });
});

// apps
// playground, selfservice, page generator ?
/*var appsDir = siteDir+'/apps';
fs.mkdir(appsDir);*/

// posts
var postTemplate = templatesDir+'/post.ejs',
    postSource = 'https://raw.githubusercontent.com/ehouais/blog-posts/master',
    getAllMatches = function(regx, string) {
        var match,
            matches = [];

        while (match = regx.exec(string)) {
            matches.push(match);
        }
        return matches
    };
fs.readFile(postTemplate, 'utf8', function(err, data) {
    var template = ejs.compile(data);
    request(postSource+'/nav.md', function (error, response, md) {
        if (error) { console.log(error); return false }
        var nav = marked(md);

        console.log('Generating blog posts...');
        getAllMatches(RegExp('href="/([0-9]{4}/[^"]+)?"', 'g'), nav).forEach(function(match) {
            var shortpath = '/'+(match[1] || 'index');
            var postUrl = postSource+shortpath+'.md';
            console.log('Fetching post "'+postUrl+'"...');
            request(postUrl, function(error, response, md) {
                var filepath = siteDir+shortpath+'.html';
                fs.ensureDirSync(path.dirname(filepath));
                fs.writeFileSync(filepath, template({
                    nav: nav,
                    post: marked(md)
                        .replace(RegExp('/cdn/', 'g'), '/assets/')
                        .replace(RegExp('//ehouais.net/blog/wp-content/uploads/[^"]+/', 'g'), '/assets/img/')
                }));
            });
        });
    });
});

// database
var dbTemplate = templatesDir+'/db.ejs';
var dbGistIdStorageId = 'dbGistId';
var githubPwdStorageId = 'githubPwd';
var dbFile = toolsDir+'/db.html';
var cipherKeyStorageId = 'cipherKey';
fetchAsset(datalib+'/observable.js');
fetchAsset(datalib+'/streams.js');
fs.readFile(dbTemplate, 'utf8', function(err, data) {
    console.log('Generating gist DB app...');
    fs.ensureDirSync(toolsDir);
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
    console.log('Generating 404.html file...');
    fs.writeFile(notfoundFile, data, function(err) {
        if (err) { console.log(err); return false }
        return true;
    });
});
