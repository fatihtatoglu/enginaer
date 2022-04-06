"use strict";

const Vinyl = require("vinyl");

/**
 * The resource class.
 * @abstract
 */
class Resource {

    /**
     * @type {Vinyl}
     */
    #file;

    /**
     * @type {string}
     */
    #content;

    /**
    * Creates a new instance of the Resource.
    * @param {Vinyl} file The file object.
    */
    constructor(file) {
        this.#file = file;
        this.#content = "";
    }

    /**
     * @returns {string}
     */
    get name() {
        return this.#file.basename.replace(this.#file.extname, "");
    }

    /**
     * @returns {string}
     */
    get content() {
        return this.#content;
    }

    /**
     * @protected
     * @param {string} value
     */
    set content(value) {
        this.#content = value;
    }

    /**
     * @protected
     * @returns {Vinyl}
     */
    get file() {
        return this.#file;
    }

    /**
     * Validates the page object.
     * @returns {Error | undefined}
     */
    validate() {
        if (!this.#file) {
            return new Error("The file must be provided.");
        }

        if (this.#file.isNull()) {
            return new Error("The file is empty.");
        }

        if (this.#file.isStream()) {
            return new Error("The stream is not supported.");
        }
    }

    /**
     * Processes the page.
     * @returns {Error | undefined}
     */
    process() {
        return;
    }
}

module.exports = Resource;