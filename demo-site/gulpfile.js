const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");
const Enginaer = require("enginaer");

var enginær = new Enginaer(config);

// load config
// validate config

// load resources
// validate resources
//// missing language ?

// process resources

// prebuild static content

// build static content

// postbuild static content

// prepare or clean destination
function cleanAll() {
    return src(enginær.OutputPath, { allowEmpty: true })
        .pipe(clean({ force: true }));
}

// prepare output files

// save output files
function save() {
    return enginær.Output()
        .pipe(dest(enginær.OutputPath));
}

exports.default = series(




    cleanAll,

    save
);