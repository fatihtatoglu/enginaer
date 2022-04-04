"use strict";

const Resource = require("./resource");

const Vinyl = require("vinyl");

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
}

module.exports = Template;