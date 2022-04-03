const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");

const outputPath = "../npm/";

function cleanAll() {
    return src([outputPath], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

function copyLibrary() {
    return src(["enginær.js", "package.json"])
        .pipe(dest(outputPath));
}

function copyLicense() {
    return src(["../LICENSE"])
        .pipe(dest(outputPath));
}

function copyReadme() {
    return src(["../README.md"])
        .pipe(dest(outputPath));
}

function copyImages() {
    return src(["../docs/*.png"])
        .pipe(dest(outputPath + "docs/"));
}

exports.default = series(
    cleanAll,
    parallel(copyLibrary, copyLicense, copyReadme, copyImages)
);