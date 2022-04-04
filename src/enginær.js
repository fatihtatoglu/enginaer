"use strict";

const PluginError = require("plugin-error");

const through = require("through2");
const path = require("path");
const Vinyl = require("vinyl");

const marked = require("marked");
const mustache = require("mustache");
const Page = require("./lib/page");
const Template = require("./lib/template");

const PLUGIN_NAME = "enginær";

class Enginaer {

    #options;

    /**
     * @type {Map<string,object>}
     */
    #pages;
    #enrichers;
    #templatePages;

    constructor() {
        this.#enrichers = {};
    }

    get outputPath() {
        return this.#options.get("output");
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

    get #generateEnrichers() {
        return this.#getEnricher("generate");
    }

    get #menuEnrichers() {
        return this.#getEnricher("menu");
    }

    setOptions(options) {
        this.#validateOption(options);

        this.#options = new Map();

        var that = this;
        for (const key in options) {
            if (that.#options.has(key)) {
                throw new PluginError(PLUGIN_NAME, "The option has already added.");
            }

            if (key === "page") {
                var enrichers = options[key]["enrichers"];

                that.#validatePageEnrichers(enrichers);
            }

            if (key === "template") {
                var helpers = options[key]["helpers"];
                that.#validateTemplateHelpers(helpers);
            }

            that.#options.set(key, options[key]);
        }
    }

    setPages() {
        var that = this;

        var markedConfig = this.#options.get("marked");
        marked.setOptions(markedConfig);

        var config = this.#options.get("config");

        var menu = this.#options.get("menu") || {};

        this.#pages = new Map();
        this.#templatePages = [];
        return through.obj((file, _encoding, cb) => {

            var page = new Page(file);
            

            let error = page.validate();
            if (error) {
                cb(new PluginError(PLUGIN_NAME, error.message), file);
                return;
            }

            error = page.process();
            if (error) {
                cb(new PluginError(PLUGIN_NAME, error.message), file);
                return;
            }

            if (!page.published) {
                cb(null, file);
                return;
            }

            console.log(page);

            var pageName = page.name;
            var fileRawContent = file.contents.toString();
            var metadata = that.#parsePageMetadata(fileRawContent);
            var htmlContent = page.content;

            that.#rawEnrichers.forEach(f => {
                var key = f["key"];
                var handler = f["handler"];

                var value = handler.call(null, htmlContent, config);
                metadata.set(key, value);
            });

            that.#menuEnrichers.forEach(f => {
                var handler = f["handler"];

                handler.call(null, metadata, menu, config);
            });

            that.#metadaEnrichers.forEach(f => {
                var key = f["key"];
                var handler = f["handler"];

                if (!metadata.has(key)) {
                    var message = "The '" + key + "' does not exist in metadata.";
                    cb(new PluginError(PLUGIN_NAME, message), file);
                }

                var value = metadata.get(key);
                value = handler.call(null, value, config);

                metadata.set(key, value);
            });

            that.#generateEnrichers.forEach(f => {
                var sourceKey = f["sourceKey"];
                var targetKey = f["targetKey"];
                var handler = f["handler"];

                if (!metadata.has(sourceKey)) {
                    var message = "The '" + sourceKey + "' does not exist in metadata.";
                    cb(new PluginError(PLUGIN_NAME, message), file);
                }

                var value = handler.call(null, metadata.get(sourceKey), config);
                metadata.set(targetKey, value);
            });

            that.#pages.set(pageName, {
                "metadata": metadata,
                "content": htmlContent
            });

            var templatePage = {
                "name": pageName
            };

            metadata.forEach((v, k) => {

                if (k === "order") {
                    v = parseInt(v);
                }

                if (k === "published") {
                    v = v === "true" ? true : false;
                }

                templatePage[k] = v;
            });

            that.#templatePages.push(templatePage);
            that.#templatePages.sort((a, b) => new Date(a["date"]) - new Date(b["date"]));

            that.#options.set("menu", menu);

            cb(null, file);
        });
    }

    setTemplates() {
        var templateConfig = this.#options.get("template");
        templateConfig["cache"] = {};

        return through.obj((file, _encoding, cb) => {

            var template = new Template(file);

            let error = template.validate();
            if (error) {
                cb(new PluginError(PLUGIN_NAME, error.message), file);
                return;
            }

            template.process();

            templateConfig["cache"][template.name] = template.content;

            cb(null, file);
        });
    }

    generate() {
        var that = this;

        var templates = this.#options.get("template")["cache"];

        var mustacheConfig = this.#options.get("template")["helpers"];

        var config = this.#options.get("config");

        var vinylFiles = [];
        for (const [, value] of this.#pages) {
            var metadata = value["metadata"];

            var templateData = { ...config, ...mustacheConfig };

            // add base url
            var basePath = config["base-url"] || path.resolve(that.#options.get("output")) + "/";
            templateData["base-path"] = basePath;

            var templateName = metadata.get("layout");
            var template = templates[templateName];

            // set content
            templateData["content"] = value["content"];

            // set menu
            templateData["menu"] = Object.values(that.#options.get("menu"));
            templateData["menu"] = templateData["menu"].sort((a, b) => a["order"] - b["order"]);

            // add page metadata
            metadata.forEach((v, k) => {
                templateData[k] = v;
            });

            templateData["pages"] = that.#templatePages;

            var permalink = templateData["permalink"];
            var output = mustache.render(template, templateData, templates);

            vinylFiles.push(new Vinyl({
                cwd: "",
                base: undefined,
                path: permalink,
                contents: Buffer.from(output)
            }));
        }

        var stream = through.obj((file, _encoding, cb) => {
            cb(null, file);
        });

        vinylFiles.forEach((vinylFile) => {
            stream.write(vinylFile);
        });

        stream.end();

        return stream;
    }

    #parsePageMetadata(fileRawContent) {
        var metadataEndIndex = fileRawContent.indexOf("---", 1);
        var metadataSection = fileRawContent.substring(4, metadataEndIndex);

        var metadata = new Map();
        var data = metadataSection.replace(/\r/g, "").split("\n");
        data.forEach((item) => {
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

    #getEnricher(type) {
        if (!this.#enrichers[type]) {
            var enrichers = this.#options.get("page")["enrichers"];
            return enrichers.filter((e) => {
                if (e["type"] === type) {
                    return e;
                }
            });
        }

        return this.#enrichers[type];
    }

    #validateOption(options) {
        if (typeof options !== "object") {
            throw new PluginError(PLUGIN_NAME, "The options must be an object.");
        }

        if (!options["config"]) {
            throw new PluginError(PLUGIN_NAME, "The options must contain 'config' object.");
        }

        if (!options["config"]["base-url"]) {
            throw new PluginError(PLUGIN_NAME, "The config object must contain 'base-url' key.");
        }
    }

    #validatePageEnrichers(enrichers) {
        enrichers.forEach((item) => {
            var handler = item["handler"];
            if (typeof handler !== "function") {
                throw new PluginError(PLUGIN_NAME, "The handler of the enricher must be a function.");
            }
        });
    }

    #validateTemplateHelpers(helpers) {
        for (var k in helpers) {
            var helper = helpers[k];
            if (typeof helper !== "function") {
                throw new PluginError(PLUGIN_NAME, "The template helper must be a function.");
            }
        }
    }
}

module.exports = new Enginaer();