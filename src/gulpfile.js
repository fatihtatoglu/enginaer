const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");

const outputPath = "../npm/";

function cleanAll() {
    return src([outputPath], { allowEmpty: true })
        .pipe(clean({ force: true }));
};

function copyLibrary() {
    return src(["enginær.js", "package.json"])
        .pipe(dest(outputPath));
}

function copyLicense() {
    return src(["../LICENSE"])
        .pipe(dest(outputPath));
}

exports.default = series(
    cleanAll,
    parallel(copyLibrary, copyLicense)
);