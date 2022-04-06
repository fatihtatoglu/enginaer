"use strict";

const PluginError = require("plugin-error");

const through = require("through2");
const path = require("path");
const fs = require("fs");
const Vinyl = require("vinyl");
const glob = require("glob");
const dayjs = require("dayjs");

const Page = require("./lib/page");
const Template = require("./lib/template");
const BasePageVisitor = require("./lib/pageVisitor");
const { threadId } = require("worker_threads");

const PLUGIN_NAME = "enginær";

class Enginaer {

    /**
     * @type {object}
     */
    #config;

    /**
     * @type {object.<string, Page>}
     */
    #pageRegistry;

    /**
     * @type {object.<string, Template>}
     */
    #templateRegistry;

    /**
     * @type {object.<string, BasePageVisitor>}
     */
    #visitorRegistry;

    /**
     * @type {object.<string, Function>}
     */
    #templatHelpers;

    constructor(config) {
        this.#config = config;
    }

    /**
     * @returns {string[]}
     */
    get #pagePaths() {
        var basePath = this.#config["base"];
        var pagePath = this.#config["page"]["path"];

        return this.#convertToPaths(basePath, pagePath);
    }

    /**
     * @returns {string[]}
     */
    get #pageVisitorPaths() {
        var basePath = this.#config["base"];
        var visitorPath = this.#config["page"]["visitor"];

        return this.#convertToPaths(basePath, visitorPath);
    }

    /**
     * @returns {string[]}
     */
    get #templatePaths() {
        var basePath = this.#config["base"];
        var templatePath = this.#config["template"]["path"];

        return this.#convertToPaths(basePath, templatePath);
    }

    /**
     * @returns {string[]}
     */
    get #templateHelpersPath() {
        var basePath = this.#config["base"];
        var templateHelperPath = this.#config["template"]["helpers"];

        return this.#convertToPaths(basePath, templateHelperPath);
    }

    /**
     * @returns{object[]}
     */
    get #allPages() {
        var allPages = [];
        for (const pageName in this.#pageRegistry) {
            /**
             * @type {Page}
             */
            var page = this.#pageRegistry[pageName];

            var pageObject = {
                "name": pageName,
                ...page.metadata
            };

            allPages.push(pageObject);
        }

        return allPages.sort((a, b) => new Date(a["date"]) - new Date(b["date"]));
    }

    load() {
        this.#templateRegistry = {};
        this.#templatHelpers = {};
        this.#visitorRegistry = {};
        this.#pageRegistry = {};

        this.#writeLog("The templates are loading...");
        this.#loadTemplates();

        this.#writeLog("The template helper functions are loading...");
        this.#loadTemplateHelpers();

        this.#writeLog("The page visitors are loading...");
        this.#loadVisitor();

        this.#writeLog("The pages are loading...");
        this.#loadPages();
    }

    generate() {
        var that = this;
        var vinylFiles = [];

        // Prepare pre-defined keys.
        var templateData = {
            "site-language": this.#config["site-language"],
            "site-culture": this.#config["site-culture"],
            "site-title-prefix": this.#config["site-title-prefix"],
            "site-name": this.#config["site-name"],
            "base-url": this.#config["base-url"],
            "base-path": this.#config["base-url"],

            ... this.#templatHelpers
        };

        templateData["pages"] = this.#allPages;

        // execute visitors.
        for (const pageName in this.#pageRegistry) {

            /**
             * @type {Page}
             */
            var page = that.#pageRegistry[pageName];
            that.#writeLog(`The page \x1b[32m'${pageName}'\x1b[0m is processing.`);

            var templateName = page.get("layout");
            var permalink = page.get("permalink");

            /**
             * @type {Template}
             */
            var template = that.#templateRegistry[templateName];
            var output = template.execute(page, templateData, that.#templateRegistry);

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

        this.#writeLog("The generation process is completed.");
        this.#writeLog("==========");

        return stream;
    }

    #loadPages() {
        var that = this;

        var markedConfig = this.#config["page"]["marked"];
        this.#pagePaths.forEach((p) => {
            that.#writeLog(`The file \x1b[35m'${p}'\x1b[0m is loading.`);

            var content = fs.readFileSync(p);
            var file = new Vinyl({
                cwd: "",
                base: undefined,
                path: p,
                contents: Buffer.from(content)
            });

            var page = new Page(file, markedConfig);
            var error = page.validate();
            if (error) {
                throw new PluginError(PLUGIN_NAME, error);
            }

            var processingError = page.process();
            if (processingError) {
                throw new PluginError(PLUGIN_NAME, processingError);
            }

            for (const visitorName in that.#visitorRegistry) {

                /**
                 * @type {BasePageVisitor}
                 */
                var visitor = that.#visitorRegistry[visitorName];
                that.#writeLog(`The visitor \x1b[33m'${visitor.name}'\x1b[0m is applied.`);

                var visitorError = page.accept(visitor);
                if (visitorError) {
                    throw new PluginError(PLUGIN_NAME, visitorError);
                }
            }

            that.#pageRegistry[page.name] = page;

            that.#writeLog(`The page \x1b[32m'${page.name}'\x1b[0m is ready for generation.`);
        });

        that.#writeLog("==========");
    }

    #loadTemplates() {
        var that = this;

        this.#templatePaths.forEach((t) => {

            that.#writeLog(`The file \x1b[35m'${t}'\x1b[0m is loading.`);

            var content = fs.readFileSync(t);
            var file = new Vinyl({
                cwd: "",
                base: undefined,
                path: t,
                contents: Buffer.from(content)
            });

            var template = new Template(file);
            var error = template.validate();
            if (error) {
                throw new PluginError(PLUGIN_NAME, error);
            }

            template.process();

            that.#templateRegistry[template.name] = template;

            that.#writeLog(`The template \x1b[32m'${template.name}'\x1b[0m is loaded.`);
        });

        that.#writeLog("==========");
    }

    #loadVisitor() {
        var that = this;

        this.#pageVisitorPaths.forEach((v) => {
            that.#writeLog(`The file \x1b[35m'${v}'\x1b[0m is loading.`);

            var vClass = require(v);
            var visitor = new vClass();

            that.#visitorRegistry[visitor.name] = visitor;

            that.#writeLog(`The page visitor \x1b[32m'${visitor.name}'\x1b[0m is loaded.`);
        });

        that.#writeLog("==========");
    }

    #loadTemplateHelpers() {
        var that = this;

        this.#templateHelpersPath.forEach((t) => {

            that.#writeLog(`The file \x1b[35m'${t}'\x1b[0m is loading.`);

            var helpers = require(t);
            for (const k in helpers) {
                that.#templatHelpers[k] = helpers[k];

                that.#writeLog(`The template helper \x1b[32m'${k}'\x1b[0m is loaded.`);
            }
        });

        that.#writeLog("==========");
    }

    #convertToPaths(basePath, config) {
        var paths = [];
        if (Array.isArray(config)) {
            config.forEach((c) => {
                Array.concat(paths, glob.sync(path.join(basePath, c)));
            });
        }
        else if (typeof config === "string") {
            paths = glob.sync(path.join(basePath, config));
        }

        return paths;
    }

    #writeLog(message) {
        var timestamp = dayjs(new Date()).format("HH:mm:ss");
        console.log(`[\x1b[90m${timestamp}\x1b[0m]`, "\x1b[36m" + PLUGIN_NAME, "\x1b[0m" + message, "\x1b[0m");
    }


    // setPages() {
    //     var that = this;

    //     var markedConfig = this.#options.get("marked");
    //     marked.setOptions(markedConfig);

    //     var config = this.#options.get("config");

    //     var menu = this.#options.get("menu") || {};

    //     this.#pageList = new Map();
    //     this.#templatePages = [];
    //     return through.obj((file, _encoding, cb) => {

    //         var page = new Page(file);


    //         let error = page.validate();
    //         if (error) {
    //             cb(new PluginError(PLUGIN_NAME, error.message), file);
    //             return;
    //         }

    //         error = page.process();
    //         if (error) {
    //             cb(new PluginError(PLUGIN_NAME, error.message), file);
    //             return;
    //         }

    //         if (!page.published) {
    //             cb(null, file);
    //             return;
    //         }

    //         console.log(page);

    //         var pageName = page.name;
    //         var fileRawContent = file.contents.toString();
    //         var metadata = that.#parsePageMetadata(fileRawContent);
    //         var htmlContent = page.content;

    //         that.#rawEnrichers.forEach(f => {
    //             var key = f["key"];
    //             var handler = f["handler"];

    //             var value = handler.call(null, htmlContent, config);
    //             metadata.set(key, value);
    //         });

    //         that.#menuEnrichers.forEach(f => {
    //             var handler = f["handler"];

    //             handler.call(null, metadata, menu, config);
    //         });

    //         that.#metadaEnrichers.forEach(f => {
    //             var key = f["key"];
    //             var handler = f["handler"];

    //             if (!metadata.has(key)) {
    //                 var message = "The '" + key + "' does not exist in metadata.";
    //                 cb(new PluginError(PLUGIN_NAME, message), file);
    //             }

    //             var value = metadata.get(key);
    //             value = handler.call(null, value, config);

    //             metadata.set(key, value);
    //         });

    //         that.#generateEnrichers.forEach(f => {
    //             var sourceKey = f["sourceKey"];
    //             var targetKey = f["targetKey"];
    //             var handler = f["handler"];

    //             if (!metadata.has(sourceKey)) {
    //                 var message = "The '" + sourceKey + "' does not exist in metadata.";
    //                 cb(new PluginError(PLUGIN_NAME, message), file);
    //             }

    //             var value = handler.call(null, metadata.get(sourceKey), config);
    //             metadata.set(targetKey, value);
    //         });

    //         that.#pageList.set(pageName, {
    //             "metadata": metadata,
    //             "content": htmlContent
    //         });

    //         var templatePage = {
    //             "name": pageName
    //         };

    //         metadata.forEach((v, k) => {

    //             if (k === "order") {
    //                 v = parseInt(v);
    //             }

    //             if (k === "published") {
    //                 v = v === "true" ? true : false;
    //             }

    //             templatePage[k] = v;
    //         });

    //         that.#templatePages.push(templatePage);
    //         that.#templatePages.sort((a, b) => new Date(a["date"]) - new Date(b["date"]));

    //         that.#options.set("menu", menu);

    //         cb(null, file);
    //     });
    // }

    // setTemplates() {
    //     var templateConfig = this.#options.get("template");
    //     templateConfig["cache"] = {};

    //     return through.obj((file, _encoding, cb) => {

    //         var template = new Template(file);

    //         let error = template.validate();
    //         if (error) {
    //             cb(new PluginError(PLUGIN_NAME, error.message), file);
    //             return;
    //         }

    //         template.process();

    //         templateConfig["cache"][template.name] = template.content;

    //         cb(null, file);
    //     });
    // }

    // oldGenerate() {
    //     var that = this;

    //     var templates = this.#options.get("template")["cache"];

    //     var mustacheConfig = this.#options.get("template")["helpers"];

    //     var config = this.#options.get("config");

    //     var vinylFiles = [];
    //     for (const [, value] of this.#pageList) {
    //         var metadata = value["metadata"];

    //         var templateData = { ...config, ...mustacheConfig };

    //         // add base url
    //         var basePath = config["base-url"] || path.resolve(that.#options.get("output")) + "/";
    //         templateData["base-path"] = basePath;

    //         var templateName = metadata.get("layout");
    //         var template = templates[templateName];

    //         // set content
    //         templateData["content"] = value["content"];

    //         // set menu
    //         templateData["menu"] = Object.values(that.#options.get("menu"));
    //         templateData["menu"] = templateData["menu"].sort((a, b) => a["order"] - b["order"]);

    //         // add page metadata
    //         metadata.forEach((v, k) => {
    //             templateData[k] = v;
    //         });

    //         templateData["pages"] = that.#templatePages;

    //         var permalink = templateData["permalink"];
    //         var output = mustache.render(template, templateData, templates);

    //         vinylFiles.push(new Vinyl({
    //             cwd: "",
    //             base: undefined,
    //             path: permalink,
    //             contents: Buffer.from(output)
    //         }));
    //     }

    //     var stream = through.obj((file, _encoding, cb) => {
    //         cb(null, file);
    //     });

    //     vinylFiles.forEach((vinylFile) => {
    //         stream.write(vinylFile);
    //     });

    //     stream.end();

    //     return stream;
    // }
}

module.exports = Enginaer;