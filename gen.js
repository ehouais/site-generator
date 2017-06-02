var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');
var ejs = require('ejs');

var sourceChartsDir = '../charts';
var chartTemplate = 'chart-template.ejs';
var destChartsDir = '../ehouais.github.io/demos/charts';
var destWebviewssDir = '../ehouais.github.io/demos/webviews';
var destPlaygroundDir = '../ehouais.github.io/demos/playground';

var sourceJs1kDir = '../js1k';
var destJs1kDir = '../ehouais.github.io/demos/js1k';

var rmdirThen = function(dir, then) {
        var next = function() {
                fs.mkdirSync(dir);
                then && then();
            };

        if (fs.existsSync(dir)) {
            rimraf(dir, next);
        } else {
            next();
        }
    };

rmdirThen(destChartsDir, function() {
    var
        version = 'dev',
        libs = {
            d3: {cdnpath: '/d3/4.2.8/d3.min'},
            leaflet: {cdnpath: '/leaflet/1.0.3/leaflet'},
            'snap.svg': {cdnpath: '/snap.svg/0.5.1/snap.svg-min'},
            timescale: {cdnpath: '/charts/'+version+'/timescale'},
            twopassresize: {cdnpath: '/charts/'+version+'/twopassresize'},
            datatable: {cdnpath: '/js-data-libs/dev/datatable'},
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

    return;
    fs.readFile(chartTemplate, 'utf8', function(err, data) {
        var template = ejs.compile(data);

        Object.keys(charts).forEach(function(id) {
            var chart = charts[id],
                config = {
                    baseUrl: 'assets/charts/'+version+'/'+id,
                    paths: {
                        http: 'assets/js-data-libs/0.1/http',
                        text: 'assets/text',
                    },
                    shim: {}
                },
                stylesheets = chart.stylesheets.map(function(filename) {
                    return (substr(filename, 0, 4) == "http" ? $this->cdnroot : $rpath."/").$filename;
                }),

                if (isset($rconfig["requirements"])) {
                    foreach($rconfig["requirements"] as $id) {
                        $info = $libs[$id];
                        $config["paths"][$id] = $this->cdnroot.$info["cdnpath"];
                        if (isset($info["exports"])) {
                            $config["shim"][$id] = array("exports" => $info["exports"]);
                        }
                    }
                    if (isset($rconfig["exports"])) {
                        foreach($rconfig["exports"] as $id => $export) {
                            $config["shim"][$id] = array("exports" => $export);
                        }
                    }
                }
                html = template(chart.data);

            fs.writeFile(path+'.html', html, function(err) {
                if (err) { console.log(err); return false }
                return true;
            });
        });
    });
});
rmdirThen(destWebviewssDir);
rmdirThen(destPlaygroundDir);

rmdirThen(destJs1kDir, function() {
    fs.readdirSync(sourceJs1kDir).filter(function(file) {
        var filepath = path.join(sourceJs1kDir, file),
            stat = fs.statSync(filepath);
        return stat.isDirectory() && file.substr(0, 1) != '.';
    }).forEach(function(dirname) {
        fs.mkdirSync(destJs1kDir+'/'+dirname);
    });
});

process.exit(0);
