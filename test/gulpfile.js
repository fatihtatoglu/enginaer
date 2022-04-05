const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");
const replace = require("gulp-replace");
const Enginaer = require("enginaer");

const outputPath = "../dist/";
const config = {
    "base": __dirname,
    "page": {
        "path": "./page/**/*.md",
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
    "site-language": "en",
    "site-culture": "en-US",
    "site-title-prefix": "Enginær - ",
    "site-name": "Enginær Demo",
    "base-url": "https://blog.tatoglu.net/enginaer/"
};


// {
//     "type": "menu",
//     "handler": function (metadata, menu) {
//         var layout = metadata.get("layout");
//         var title = metadata.get("title");
//         if (layout === "page") {
//             var menuItem = {
//                 "title": title,
//                 "url": metadata.get("permalink"),
//                 "order": metadata.get("order")
//             };
//             if (metadata.get("published") !== "true") {
//                 menuItem["disabled"] = true;
//                 delete menuItem["url"];
//             }
//             menu[title] = menuItem;
//         }
//     }
// },
// {
//     "type": "menu",
//     "handler": function (metadata, menu, _config) {
//         var posts = menu["posts"] || {
//             "title": "Posts",
//             "children": [],
//             "order": 9999
//         };
//         var layout = metadata.get("layout");
//         if (layout === "post") {
//             var menuItem = {
//                 "title": metadata.get("title"),
//                 "url": metadata.get("permalink"),
//                 "date": metadata.get("date")
//             };
//             if (metadata.get("published") !== "true") {
//                 menuItem["disabled"] = true;
//                 delete menuItem["url"];
//             }
//             posts["children"].push(menuItem);
//             posts["children"] = posts["children"].sort(function (a, b) {
//                 return new Date(a["date"]) - new Date(b["date"]);
//             });
//             menu["posts"] = posts;
//         }
//     }
// }

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
        .pipe(replace(/..\/assets\/img\//g, "./img/"))
        .pipe(dest(outputPath));
}

exports.default = series(
    cleanAll,
    parallel(copyAssets, generate)
);