const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");
const gutil = require("gulp-util");

const fs = require("fs");
const path = require("path");
const through = require("through2");

const mustache = require("mustache");
const marked = require("marked");

marked.setOptions({
    breaks: true,
    smartLists: true,
    headerIds: false
});

var menuItems = [];
var pages = [];

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
        .pipe(through.obj(function (file, encoding, cb) {

            if (!fileSanityCheck(file, cb)) {
                return;
            }

            var page = extractMetadata(file);
            var filePath = path.parse(file.path);

            page["path"] = filePath.dir;
            page["base"] = filePath.base;
            page["name"] = filePath.name;

            pages.push(page);

            cb(null, file);
        }));
}

function generateMenu(cb) {

    pages.filter(function (page) {
        if (page["layout"] === "page") {
            return page;
        }
    }).forEach(function (page) {

        var menuItem = {};
        menuItem["title"] = page["title"];
        menuItem["url"] = page["permalink"];
        menuItem["order"] = page["order"];

        menuItems.push(menuItem);
    });

    menuItems = menuItems.sort(function (a, b) { return a["order"] - b["order"]; });

    return cb();
}

function generataFiles(cb) {

    var config = fs.readFileSync("config.json");
    var configObject = JSON.parse(config.toString());

    var menuData = {
        menuItems: menuItems,
        "separator": function () {
            return this.role === "separator";
        },
        "hasChildren": function () {
            return this.children && this.children.length > 0;
        },
        "url": function () {
            if (this.url) {
                return this.url;
            }

            return "javascript:;";
        }
    };

    var templatePaths = {};

    var partialsTemplates = {};
    partialsTemplates["_footer"] = fs.readFileSync("./template/_footer.mustache").toString();
    partialsTemplates["_menu"] = fs.readFileSync("./template/_menu.mustache").toString();

    pages.forEach(function (page) {

        if (!templatePaths[page["layout"]]) {
            var templatePath = "./template/" + page["layout"] + ".mustache";
            templatePaths[page["layout"]] = fs.readFileSync(templatePath).toString();
        }

        var template = templatePaths[page["layout"]];
        var data = { ...page, ...menuData, ...configObject };
        data["base-path"] = path.resolve("../dist/") + "/";

        var output = mustache.render(template, data, partialsTemplates);

        // fix headers
        output = output.replace("<h1>", "<header><h1>");
        output = output.replace("</h1>", "</h1></header>");

        // fix image paths
        output = output.replace(/..\/assets\/img\//g, "./img/");

        var permalink = data["permalink"];
        var name = data["name"];

        var outputPath = permalink.replace(name + ".html", "");

        var folderPath = path.resolve(path.join("../dist", outputPath));
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        var filePath = path.join(folderPath, name + ".html");
        fs.writeFileSync(filePath, output);
    });

    cb();
}

function fileSanityCheck(file, cb) {
    if (file.isNull()) {
        cb(new gutil.PluginError("fatih", "File is null."));
        return false;
    }

    if (file.isStream()) {
        cb(new gutil.PluginError("fatih", "Streaming not supported."));
        return false;
    }

    if (!file.contents) {
        cb(new gutil.PluginError("fatih", "File 'contents' property is missing."));
        return false;
    }

    var content = file.contents.toString();
    if (!content.startsWith("---")) {
        cb(new gutil.PluginError("fatih", "File must start with metadata section."));
        return false;
    }

    return true;
}

function extractMetadata(file) {
    var data = {};

    var content = file.contents.toString();
    var metadataEndIndex = content.indexOf("---", 1);
    var metadata = content.substring(4, metadataEndIndex);
    var markdownContent = content.substring(metadataEndIndex + 3);
    var pageContent = marked.parse(markdownContent);

    data["content"] = pageContent;

    var titleRegex = /<h1>(.*)<\/h1>/g;
    var titleResult = titleRegex.exec(pageContent);
    var title = titleResult[1];

    data["title"] = title;

    var pair = metadata.replace("\r", "").split("\n");
    pair.forEach(function (item) {
        if (item.lenght === 0) {
            return;
        }

        var kvp = item.split(": ");
        var key = kvp[0];
        var value = kvp[1];

        if (key === "tags") {
            value = value.split(" ").map(function (v) {
                return v.replace("_", " ");
            });
        }

        if (key === "") {
            return;
        }

        data[key] = value;
    });

    data["date"] = new Date(Date.parse(data["date"]));

    return data;
}

exports.default = series(
    cleanAll,
    parallel(copyAssets, readPages),
    generateMenu,
    generataFiles
);