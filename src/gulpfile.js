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

function cleanAll() {
    return src(["publish/"], { allowEmpty: true })
        .pipe(clean({ force: true }));
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

            var templatePath = "./templates/" + data["layout"] + ".mustache";
            var template = fs.readFileSync(templatePath);

            var output = mustache.render(template.toString(), data);
            
            // fix headers
            output = output.replace("<h1>", "<header><h1>");
            output = output.replace("</h1>", "</h1></header>");

            console.log(output);


            // ! menu 
            // ! footer
            
            // ! bir sonraki adım için çıktıyı ilet.

            this.push(file);
            cb();
        }));
}




exports.default = series(
    cleanAll,
    readPages
);