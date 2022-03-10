const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");
const Enginær = require("./enginær");

/**
 * Path Declarations
 */
/* ================================================================================ */
const baseSourcePath = "./test/";
const outputPath = "../dist/";

const configPath = baseSourcePath + "./config.json";
const templateFolderPath = baseSourcePath + "./template";
const baseAssetPath = baseSourcePath + "/assets";
const assetPathList = [
    baseAssetPath + "/css/*.css",
    baseAssetPath + "/js/*.js",
    baseAssetPath + "/img/*.png",
    baseAssetPath + "/img/*.jpg"
];

const pagePathList = [
    baseSourcePath + "./page/**/*.md"
];
/* ================================================================================ */

const engine = new Enginær(configPath, templateFolderPath);

/**
 * Register Fixers
 */
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

/**
 * Register Tepmplate Functions
 */
engine.registerTemplateFunctionMap("separator", function () {
    return this.role === "separator";
});

engine.registerTemplateFunctionMap("hasChildren", function () {
    return this.children && this.children.length > 0;
});

engine.registerTemplateFunctionMap("url", function () {
    if (this.url) {
        return this.url;
    }

    return "javascript:;";
});

// Gulp Step 1 - Clean old files.
function cleanAll() {
    return src([outputPath], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

// Gulp Step 2 - Copy all required assets.
function copyAssets() {
    return src(assetPathList, { base: baseAssetPath })
        .pipe(dest(outputPath));
}

// Gulp Step 3 - Read Markdown Pages
function readPages() {
    return src(pagePathList)
        .pipe(engine.readPages());
}

// Gulp Step 4 - Generate Web Site
function generateWebSite(cb) {
    engine.generateMenu();
    engine.generateFiles(outputPath);

    cb();
};

exports.default = series(
    cleanAll,
    parallel(copyAssets, readPages),
    generateWebSite
);