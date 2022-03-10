"use strict";

const through = require("through2");
const path = require("path");
const marked = require("marked");
const fs = require("fs");
const mustache = require("mustache");

marked.setOptions({
    breaks: true,
    smartLists: true,
    headerIds: false
});

class Enginær {

    #pages;
    #menuItems;
    #configPath;
    #templatePath;

    #configMap;
    #templateMap;
    #fixerMap;

    constructor(configPath, templatePath) {

        if (!new.target) {
            throw "must initialize the Enginær.";
        }

        this.#configPath = configPath;
        this.#templatePath = templatePath;

        this.#pages = [];
        this.#menuItems = [];
        this.#configMap = null;
        this.#templateMap = null;
        this.#fixerMap = new Map();
    }

    get #menu() {
        var items = this.#menuItems.sort(function (a, b) {
            return a["order"] - b["order"];
        });

        var data = {
            menuItems: items,
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

        return data;
    }

    get #templates() {

        if (this.#templateMap === null) {
            var that = this;
            this.#templateMap = {};

            fs.readdirSync(this.#templatePath).filter(item => {
                return item.endsWith(".mustache");
            }).forEach(item => {
                var templatePath = path.join(that.#templatePath, item);
                var key = item.replace(".mustache", "");

                that.#templateMap[key] = fs.readFileSync(templatePath).toString();
            });
        }

        return this.#templateMap;
    }

    get #config() {
        if (this.#configMap === null) {
            var config = fs.readFileSync(this.#configPath);
            this.#configMap = JSON.parse(config.toString());
        }

        return this.#configMap;
    }

    readPages() {
        var that = this;

        return through.obj(function (file, encoding, cb) {
            if (!that.#fileSanityCheck(file, cb)) {
                return;
            }

            var page = that.#extractMetadata(file);
            var filePath = path.parse(file.path);

            page["path"] = filePath.dir;
            page["base"] = filePath.base;
            page["name"] = filePath.name;

            that.#addPage(page);

            cb(null, file);
        });
    }

    generateMenu() {
        var posts = {
            "title": "Posts",
            "children": []
        };

        var that = this;
        this.#pages.forEach(function (page) {

            if (page["layout"] === "page") {
                var pageMenuItem = {
                    "title": page["title"],
                    "url": page["permalink"],
                    "order": page["order"]
                };

                if (page["published"] === "false") {
                    pageMenuItem["disabled"] = true;
                    delete pageMenuItem["url"];
                }

                that.#addMenuItem(pageMenuItem);
            }
            else if (page["layout"] === "post") {
                var postMenuItem = {
                    "title": page["title"],
                    "url": page["permalink"],
                    "date": page["date"]
                };

                if (page["published"] === "false") {
                    postMenuItem["disabled"] = true;
                    delete postMenuItem["url"];
                }

                posts["children"].push(postMenuItem);
            }
        });

        posts["children"] = posts["children"].sort(function (a, b) {
            return a["date"] - b["date"];
        });

        this.#addMenuItem(posts);
    }

    generateFiles() {
        var outputBasePath = "../dist/";

        var that = this;
        this.#pages.forEach(function (page) {

            var templateName = page["layout"];
            var data = { ...page, ...that.#menu, ...that.#config };
            data["base-path"] = path.resolve(outputBasePath) + "/";

            var output = mustache.render(that.#templates[templateName], data, that.#templates);

            for (let [_, fixer] of that.#fixerMap) {
                output = fixer.call(this, output);
            }

            var permalink = data["permalink"];
            var outputPath = path.parse(path.join(outputBasePath, permalink));

            var folderPath = path.resolve(outputPath.dir);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            var filePath = path.join(folderPath, outputPath.base);
            fs.writeFileSync(filePath, output);
        });
    }

    registerFixer(name, callback) {
        if (this.#fixerMap.has(name)) {
            throw "the callback has already registered.";
        }

        this.#fixerMap.set(name, callback);
    }

    #fileSanityCheck(file, cb) {
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

    #extractMetadata(file) {
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

        var that = this;
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

        var date = new Date(Date.parse(data["date"]));
        data["date"] = date;
        data["publish-date"] = date.toISOString();
        data["publish-date-localformat"] = date.toLocaleDateString(that.#config["site-culture"]);
        data["publish-date-title"] = date.toString(that.#config["site-culture"]);

        return data;
    }

    #addPage(page) {
        this.#pages.push(page);
    }

    #addMenuItem(item) {
        this.#menuItems.push(item);
    }
}

module.exports = Enginær;