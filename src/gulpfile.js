const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");
const gutil = require("gulp-util");

const fs = require("fs");
const path = require("path");
const replaceExt = require("replace-ext");
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
var posts = [];

function cleanAll() {
    return src(["../dist"], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

function copyAssets() {
    return src(["assets/css/*.css", "assets/js/*.js", "assets/img/*.png", "assets/img/*.jpg"], { base: "assets" })
        .pipe(dest("../dist"));
}

function readPages() {
    return src(["page/**/*.md"])
        .pipe(through.obj(function (file, encoding, cb) {
            if (file.isNull()) {
                this.push(file);
                return cb();
            }

            if (file.isStream()) {
                cb(new gutil.PluginError("fatih", "Streaming not supported"));
                return;
            }

            if (!file.contents) {
                cb(new gutil.PluginError("fatih", "file 'contents' property is missing."));
                return;
            }

            var content = file.contents.toString();
            if (!content.startsWith("---")) {
                cb(new gutil.PluginError("fatih", "file must start with metadata section."));
                return;
            }

            var data = {};

            var metadataEnd = content.indexOf("---", 1);
            var metadata = content.substring(4, metadataEnd);
            var markdownContent = content.substring(metadataEnd + 3);
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

            var config = fs.readFileSync("config.json");
            var configObject = JSON.parse(config.toString());
            for (const k in configObject) {
                data[k] = configObject[k];
            }

            var templatePath = "./template/" + data["layout"] + ".mustache";
            var template = fs.readFileSync(templatePath);
            var partials = {};
            partials["_footer"] = fs.readFileSync("./template/_footer.mustache").toString();

            var output = mustache.render(template.toString(), data, partials);

            // fix headers
            output = output.replace("<h1>", "<header><h1>");
            output = output.replace("</h1>", "</h1></header>");

            file.contents = Buffer.from(output);
            file.path = replaceExt(file.path, ".html");

            if (file.stat) {
                file.stat.atime = file.stat.mtime = file.stat.ctime = new Date();
            }

            menuItems.push({
                "title": data["title"],
                "url": data["permalink"]
            });

            cb(null, file);
        }))
        .pipe(dest("../dist"));
}

function readPosts(cb) {
    cb();
}

function renderLayout(cb) {
    cb();
}


exports.default = series(
    cleanAll,
    copyAssets,
    parallel(readPages, readPosts),
    renderLayout
);