const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");

const Enginær = require("./enginær");
let engine = new Enginær("./config.json", "./template");

engine.registerFixer("header-fixer", function (pageText) {
    var text = pageText;

    text = text.replace("<h1>", "<header><h1>");
    text = text.replace("</h1>", "</h1></header>");

    return text;
});

engine.registerFixer("image-path-fixer", function (pageText) {
    var text = pageText;

    text = text.replace(/..\/assets\/img\//g, "./img/");

    return text;
});

function cleanAll() {
    return src(["../dist"], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

function copyAssets() {
    return src(["assets/css/*.css", "assets/js/*.js", "assets/img/*.png", "assets/img/*.jpg"], { base: "assets" })
        .pipe(dest("../dist"));
}

function readPages() {
    return src("page/**/*.md")
        .pipe(engine.readPages());
}

function generateMenu(cb) {
    engine.generateMenu();

    cb();
};

function generataFiles(cb) {
    engine.generateFiles();

    cb();
};

exports.default = series(
    cleanAll,
    parallel(copyAssets, readPages),
    generateMenu,
    generataFiles
);