"use strict";

const Resource = require("./resource");
const Page = require("./page");

const Vinyl = require("vinyl");
const mustache = require("mustache");

class Template extends Resource {

    /**
     * Creates a new instance of the Template.
     * @param {Vinyl} file The file object.
     */
    constructor(file) {
        super(file);
    }

    /**
     * Validates the template object.
     * @returns {Error | undefined}
     */
    validate() {
        var result = super.validate();
        if (result) {
            return result;
        }

        if (this.file.extname !== ".mustache") {
            return new Error("Only mustache templates are supported. The file extention must be '.mustache'.");
        }
    }

    /**
     * Processes the template object.
     */
    process() {
        super.process();
        this.content = this.file.contents.toString();
    }

    /**
     * Executes templates.
     * @param {Page} page 
     * @param {object} data 
     * @param {object.<string, Template>=} opt_templates 
     * @returns {string}
     */
    execute(page, data, opt_templates) {

        var templateData =
        {
            ...page.metadata,
            ...data
        };

        var templates = {};
        if (opt_templates) {
            for (const tKey in opt_templates) {
                templates[tKey] = opt_templates[tKey].content;
            }
        }

        templateData["content"] = page.content;

        return mustache.render(this.content, templateData, templates);
    }
}

module.exports = Template;