const { series, parallel, src, dest, tree } = require("gulp");
const clean = require("gulp-clean");
const replace = require("gulp-replace");
const enginær = require("enginaer");

enginær.setOptions({
    "output": "../dist/",

    "asset": {
        "base": "./assets/",
        "path": [
            "./assets/css/*.css",
            "./assets/js/*.js",
            "./assets/img/*.png",
            "./assets/img/*.jpg"
        ]
    },

    "page": {
        "path": "./page/**/*.md",
        "enrichers": [
            {
                "key": "title",
                "type": "raw",
                "handler": function (fileRawContent) {
                    var titleRegex = /<h1>(.*)<\/h1>/g;
                    var titleResult = titleRegex.exec(fileRawContent);

                    return titleResult[1];
                }
            },
            {
                "key": "tags",
                "type": "metadata",
                "handler": function (value) {
                    return value.split(" ").map(v => {
                        return v.replace(/\_/g, " ");
                    });
                }
            },
            {
                "key": "date",
                "type": "metadata",
                "handler": function (value) {
                    return new Date(Date.parse(value));
                }
            },
            {
                "sourceKey": "date",
                "targetKey": "publish-date",
                "type": "generate",
                "handler": function (date) {
                    return date.toISOString();
                }
            },
            {
                "sourceKey": "date",
                "targetKey": "publish-date-localformat",
                "type": "generate",
                "handler": function (date, config) {
                    return date.toLocaleDateString(config["site-culture"]);
                }
            },
            {
                "sourceKey": "date",
                "targetKey": "publish-date-title",
                "type": "generate",
                "handler": function (date, config) {
                    return date.toString(config["site-culture"]);
                }
            },
            {
                "type": "menu",
                "handler": function (metadata, menu) {

                    var layout = metadata.get("layout");
                    var title = metadata.get("title");
                    if (layout === "page") {
                        var menuItem = {
                            "title": title,
                            "url": metadata.get("permalink"),
                            "order": metadata.get("order")
                        };

                        if (metadata.get("published") !== "true") {
                            menuItem["disabled"] = true;
                            delete menuItem["url"];
                        }

                        menu[title] = menuItem;
                    }
                }
            },
            {
                "type": "menu",
                "handler": function (metadata, menu, config) {

                    var posts = menu["posts"] || {
                        "title": "Posts",
                        "children": [],
                        "order": 9999
                    };

                    var layout = metadata.get("layout");
                    if (layout === "post") {
                        var menuItem = {
                            "title": metadata.get("title"),
                            "url": metadata.get("permalink"),
                            "date": metadata.get("date")
                        };

                        if (metadata.get("published") !== "true") {
                            menuItem["disabled"] = true;
                            delete menuItem["url"];
                        }

                        posts["children"].push(menuItem);
                        posts["children"] = posts["children"].sort(function (a, b) {
                            return new Date(a["date"]) - new Date(b["date"]);
                        });

                        menu["posts"] = posts;
                    }
                }
            }
        ]
    },

    "template": {
        "path": "./template/*.mustache",
        "helpers": {
            "separator": function () {
                return this.role === "separator";
            },
            "hasChildren": function () {
                return this.children && this.children.length > 0;
            },
            "url": function () {
                if (this.url) {
                    return this.url.toString();
                }

                return "javascript:;";
            }
        }
    },

    "config": {
        "site-language": "en",
        "site-culture": "en-US",
        "site-title-prefix": "Enginær - ",
        "site-name": "Enginær Demo",
        "base-url": "https://blog.tatoglu.net/enginaer/"
    },

    "marked": {
        breaks: true,
        smartLists: true,
        headerIds: false
    }
});

// Gulp Step 1 - Clean old files.
function cleanAll() {
    return src([enginær.outputPath], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

// Gulp Step 2 - Copy all required assets.
function copyAssets() {
    return src(enginær.assetPath, { base: enginær.assetBasePath })
        .pipe(dest(enginær.outputPath));
}

// Gulp Step 3 - Add Pages
function loadPages() {
    return src(enginær.pagePath)
        .pipe(enginær.setPages());
}

// Gulp Step 4 - Add Templates
function loadTemplates() {
    return src(enginær.templatePath)
        .pipe(enginær.setTemplates());
}

// Gulp Step 5 - Generate Output
function generate() {
    return enginær.generate()
        .pipe(replace("<h1>", "<header><h1>"))
        .pipe(replace("</h1>", "</h1></header>"))
        .pipe(replace(/..\/assets\/img\//g, "./img/"))
        .pipe(dest("../dist/"));
}

exports.default = series(
    cleanAll,

    parallel(copyAssets, loadPages, loadTemplates),

    generate
);