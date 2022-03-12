"use strict";

const PluginError = require("plugin-error");

const through = require("through2");
const path = require("path");
const Vinyl = require("vinyl");

const marked = require("marked");
const mustache = require("mustache");

class Enginær {

    #options;
    #pages;
    #enrichers;

    constructor() {
        this.#enrichers = {};
    }

    get outputPath() {
        var outputPath = this.#options.get("output");
        return outputPath;
    }

    get assetPath() {
        var assetConfig = this.#options.get("asset");
        return assetConfig["path"];
    }

    get assetBasePath() {
        var assetConfig = this.#options.get("asset");
        return assetConfig["base"];
    }

    get pagePath() {
        var pageConfig = this.#options.get("page");
        return pageConfig["path"];
    }

    get templatePath() {
        var templateConfig = this.#options.get("template");
        return templateConfig["path"];
    }

    get #metadaEnrichers() {
        return this.#getEnricher("metadata");
    }

    get #rawEnrichers() {
        return this.#getEnricher("raw");
    }

    setOptions(options) {
        if (typeof options !== "object") {
            throw new PluginError("enginær", "options must be an object");
        }

        this.#options = new Map();

        var that = this;
        for (const key in options) {
            if (that.#options.has(key)) {
                throw new PluginError("enginær", "the option has already added.");
            }

            that.#options.set(key, options[key]);
        }
    }

    setPages() {
        var that = this;
        this.#pages = new Map();

        return through.obj(function (file, encoding, cb) {
            if (!that.#checkPageFileSanity(file, cb)) {
                return;
            }

            var pageName = that.#getFileName(file);

            var fileRawContent = file.contents.toString();

            var metadata = that.#parsePageMetadata(fileRawContent);
            var pageContent = that.#parsePageContent(fileRawContent);

            that.#metadaEnrichers.forEach(f => {
                var key = f["key"];
                var handler = f["handler"];

                if (!metadata.has(key)) {
                    var message = "'" + key + "' does not exist in metadata.";
                    cb(new PluginError("enginær", message), file);
                }

                var value = metadata.get(key);
                value = handler.call(null, value);

                metadata.set(key, value);
            });

            that.#pages.set(pageName, {
                "metadata": metadata,
                "content": pageContent
            });

            cb(null, file);
        });
    }

    setTemplates() {
        var that = this;
        var templateConfig = this.#options.get("template");
        templateConfig["cache"] = {};

        return through.obj(function (file, encoding, cb) {
            if (!that.#checkTemplateFileSanity(file, cb)) {
                return;
            }
            var name = that.#getFileName(file);
            var content = file.contents.toString();

            templateConfig["cache"][name] = content;

            cb(null, file);
        });
    }

    generate() {
        var templates = this.#options.get("template")["cache"];

        var markedConfig = this.#options.get("marked");
        marked.setOptions(markedConfig);

        var mustacheConfig = this.#options.get("template")["helpers"];

        var vinylFiles = [];

        var that = this;
        for (const [key, value] of this.#pages) {
            var metadata = value["metadata"];
            var config = that.#options.get("config");

            var templateData = { ...config, ...mustacheConfig };

            // add base url
            var basePath = config["base-url"] || path.resolve(that.#options.get("output")) + "/";
            templateData["base-path"] = basePath;

            var templateName = metadata.get("layout");
            var template = templates[templateName];

            var markdownContent = value["content"];
            var htmlContent = marked.parse(markdownContent);
            templateData["content"] = htmlContent;

            that.#rawEnrichers.forEach(f => {
                var key = f["key"];
                var handler = f["handler"];

                var value = handler.call(null, htmlContent);
                metadata.set(key, value);
            });

            // add page metadata
            metadata.forEach((v, k) => {
                templateData[k] = v;
            });

            var permalink = templateData["permalink"];
            var output = mustache.render(template, templateData, templates);

            vinylFiles.push(new Vinyl({
                cwd: "",
                base: undefined,
                path: permalink,
                contents: Buffer.from(output)
            }));
        }

        var stream = through.obj(function (file, encoding, cb) {
            cb(null, file);
        });

        vinylFiles.forEach(function (vinylFile) {
            stream.write(vinylFile);
        });

        stream.end();

        return stream;
    }

    #checkPageFileSanity(file, cb) {
        if (file.isNull()) {
            var message = "Page file is null.";
            cb(new PluginError("enginær", message), file);

            return false;
        }

        if (file.isStream()) {
            var message = "Stream is not supported";
            cb(new PluginError("enginær", message), file);

            return false;
        }

        if (!file.contents) {
            var message = "'content' property is missing.";
            cb(new PluginError("enginær", message), file);

            return false;
        }

        var content = file.contents.toString();
        if (!content.startsWith("---")) {
            var message = "File must be started with metadata section.";
            cb(new PluginError("enginær", message), file);

            return false;
        }

        return true;
    }

    #checkTemplateFileSanity(file, cb) {
        if (file.isNull()) {
            var message = "Template file is null.";
            cb(new PluginError("enginær", message), file);

            return false;
        }

        if (file.isStream()) {
            var message = "Stream is not supported";
            cb(new PluginError("enginær", message), file);

            return false;
        }

        if (!file.contents) {
            var message = "'content' property is missing.";
            cb(new PluginError("enginær", message), file);

            return false;
        }

        return true;
    }

    #getFileName(file) {
        var fileInfo = path.parse(file.path);
        return fileInfo.name;
    }

    #parsePageMetadata(fileRawContent) {
        var metadataEndIndex = fileRawContent.indexOf("---", 1);
        var metadataSection = fileRawContent.substring(4, metadataEndIndex);

        var metadata = new Map();
        var data = metadataSection.replace("/\r/g", "").split("\n");
        data.forEach(function (item) {
            if (item.length === 0) {
                return;
            }

            var kvp = item.split(": ");
            var key = kvp[0];
            if (key === "") {
                return;
            }

            var value = kvp[1];

            metadata.set(key, value);
        });

        return metadata;
    }

    #parsePageContent(fileRawContent) {
        var metadataEndIndex = fileRawContent.indexOf("---", 1);
        var pageContent = fileRawContent.substring(metadataEndIndex + 3);

        return pageContent;
    }

    #getEnricher(type) {
        if (!this.#enrichers[type]) {
            var enrichers = this.#options.get("page")["enrichers"];
            return enrichers.filter(function (e) {
                if (e["type"] === type) {
                    return e;
                }
            });
        }

        return this.#enrichers[type];
    }
}

module.exports = new Enginær();