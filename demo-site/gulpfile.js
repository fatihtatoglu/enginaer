const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");
const Enginaer = require("enginaer");

var enginær = new Enginaer();

// load config --> search 'enginear.json' file in the root folder.
// validate config --> check only required configs, such as site.language & site.url

// load resources
// - assets --> just for copy
// - content
// - template
// - template plugins
// - content visitors

// process resources
// - content
// - template

// prebuild static content -> process md operations
// - markdown visitors

// build static content -> convert md to partial html
// - execute template plugins
// - execute content visitors
// - merge with templates

// postbuild static content
// - sitemap data
// - rss feed data

// prepare or clean destination
function cleanAll() {
    return src(enginær.OutputPath, { allowEmpty: true })
        .pipe(clean({ force: true }));
}

// prepare output files
// - css
// - js
// - img
// - content output

// save output files
function save() {
    return enginær.Output()
        .pipe(dest(enginær.OutputPath));
}

exports.default = series(




    cleanAll,

    save
);