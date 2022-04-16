const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");
const replace = require("gulp-replace");
const Enginaer = require("enginaer");

const os = require("os");

var baseUrl;
if (os.platform() === "win32") {
    baseUrl = "http://localhost:8080/";
}
else {
    baseUrl = "https://blog.tatoglu.net/enginaer/";
}

const outputPath = "../dist/";
const config = {
    "base": __dirname,
    "page": {
        "path": ["./page/**/*.md", "./post/**/*.md"],
        "visitor": "./page/**/*Visitor.js",
        "marked": {
            breaks: true,
            smartLists: true,
            headerIds: false
        }
    },
    "template": {
        "path": "./template/*.mustache",
        "helpers": "./template/templateHelpers.js"
    },
    "site-title-prefix": "Enginær - ",
    "site-name": "Enginær Demo",
    "base-url": baseUrl
};

// Gulp Step 1 - Clean old files.
function cleanAll() {
    return src(outputPath, { allowEmpty: true })
        .pipe(clean({ force: true }));
}

// Gulp Step 2 - Copy all required assets.
function copyAssets() {
    return src(["./assets/css/*.css",
        "./assets/js/*.js",
        "./assets/img/*.png",
        "./assets/img/*.jpg"], { base: "./assets/" })
        .pipe(dest(outputPath));
}

// Gulp Step 3 - Execute Enginær
function generate() {
    var enginær = new Enginaer(config);
    enginær.load();

    return enginær.generate()
        .pipe(replace("<h1>", "<header><h1>"))
        .pipe(replace("</h1>", "</h1></header>"))
        .pipe(replace(/..\/..\/assets\/img\//g, "img/"))
        .pipe(replace(/..\/assets\/img\//g, "img/"))
        .pipe(dest(outputPath));
}

exports.default = series(
    cleanAll,
    parallel(copyAssets, generate)
);