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
const PathHelper = require("./lib/pathHelper");

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

    /**
     * @type {PathHelper}
     */
    #pathHelper;

    constructor(config) {
        this.#validateConfig(config);
        this.#validatePageConfig(config);
        this.#validateTemplateConfig(config);

        this.#config = config;

        this.#pathHelper = new PathHelper();
    }

    /**
     * @returns {string[]}
     */
    get #pagePaths() {
        var basePath = this.#config["base"];
        var pagePath = this.#config["page"]["path"];

        return this.#pathHelper.toPath(basePath, pagePath);
    }

    /**
     * @returns {string[]}
     */
    get #pageVisitorPaths() {
        var basePath = this.#config["base"];
        var visitorPath = this.#config["page"]["visitor"];

        return this.#pathHelper.toPath(basePath, visitorPath);
    }

    /**
     * @returns {string[]}
     */
    get #templatePaths() {
        var basePath = this.#config["base"];
        var templatePath = this.#config["template"]["path"];

        return this.#pathHelper.toPath(basePath, templatePath);
    }

    /**
     * @returns {string[]}
     */
    get #templateHelpersPath() {
        var basePath = this.#config["base"];
        var templateHelperPath = this.#config["template"]["helpers"];

        return this.#pathHelper.toPath(basePath, templateHelperPath);
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

    /**
     * Generates pages.
     * @returns {NodeJS.ReadWriteStream}
     */
    generate() {
        var that = this;
        var vinylFiles = [];

        // Prepare pre-defined keys.
        var templateData = {
            "site-title-prefix": this.#config["site-title-prefix"],
            "site-name": this.#config["site-name"],
            "base-url": this.#config["base-url"],

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

    #validateConfig(config) {
        if (!config) {
            throw new Error("The config must be provided!");
        }

        const mandatoryKeys = ["base", "page", "template", "site-title-prefix", "site-name", "base-url"];

        var result = true;
        mandatoryKeys.forEach((key) => {
            if (!result) {
                return;
            }

            result = config[key] !== undefined;
        });

        if (!result) {
            throw new Error("The one of the mandatory key is missing in the config. The mandatory keys: ['base', 'page', 'template', 'site-title-prefix', 'site-name', 'base-url'].");
        }
    }

    #validatePageConfig(config) {
        if (!config["page"]["path"]) {
            throw new Error("The page config must have 'path' key!");
        }
    }

    #validateTemplateConfig(config) {
        if (!config["template"]["path"]) {
            throw new Error("The template config must have 'path' key!");
        }
    }

    #writeLog(message) {
        var timestamp = dayjs(new Date()).format("HH:mm:ss");
        console.log(`[\x1b[90m${timestamp}\x1b[0m]`, "\x1b[36m" + PLUGIN_NAME, "\x1b[0m" + message, "\x1b[0m");
    }
}

module.exports = Enginaer;