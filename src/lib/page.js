"use strict";

const Vinyl = require("vinyl");
const marked = require("marked");

const METADATA_TOKEN = "---";

class Page {

    /**
     * @type {Vinyl}
     */
    #file;

    /**
     * @type {string}
     */
    #content;

    /**
     * @type {Map}
     */
    #metadata;

    /**
     * Creates a new instance of the Page.
     * @param {Vinyl} file The file object.
     */
    constructor(file, opt_markedConfig) {
        this.#file = file;

        this.#metadata = new Map();
        this.#content = "";

        opt_markedConfig = opt_markedConfig || {
            breaks: true,
            smartLists: true,
            headerIds: false
        };

        marked.setOptions(opt_markedConfig);
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
     * @type {boolean}
     */
    get published() {
        return this.#metadata.get("published") === "true";
    }

    /**
     * Accepts the page visitor object.
     * @param {BasePageVisitor} visitor The visitor for changing page object.
     */
    accept(visitor) {
        return visitor.visit(this);
    }

    /**
     * Processes the page.
     * @returns {Error | null}
     */
    process() {
        var that = this;

        let rawContent = this.#file.contents.toString();

        let index = rawContent.indexOf(METADATA_TOKEN, 1);
        let metadataSection = rawContent.substring(4, index);
        let pageSection = rawContent.substring(index + 3);

        this.#content = marked.parse(pageSection);

        var data = metadataSection.replace(/\r/g, "").split("\n");
        data.forEach((item) => {
            if (item.length === 0) {
                return;
            }

            var pair = item.split(": ");
            var key = pair[0];
            if (key === "") {
                return;
            }

            var value = pair[1];

            that.#metadata.set(key, value);
        });

        if (!this.#checkMetadata()) {
            return new Error("The mandatory metadata is missing.");
        }

        return null;
    }

    /**
     * Validates the page object.
     * @returns {Error | null}
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

        let content = this.#file.contents.toString();
        if (!content.startsWith("---")) {
            return new Error("The file must be started with metadata section.");
        }

        return null;
    }

    /**
     * @param {string} key 
     * @returns {boolean}
     */
    has(key) {
        return this.#metadata.has(key);
    }

    /**
     * @param {string} key 
     * @returns {*}
     */
    get(key) {
        return this.#metadata.get(key);
    }

    /**
     * @param {string} key 
     * @param {*} value 
     */
    set(key, value) {
        this.#metadata.set(key, value);
    }

    /**
     * Checks mandatory metadata.
     * @returns {boolean}
     */
    #checkMetadata() {
        var that = this;
        const mandatoryKeys = ["layout", "published", "author", "date", "permalink"];

        var result = true;
        mandatoryKeys.forEach((key) => {
            if (!result) {
                return;
            }

            result = that.#metadata.has(key);
        });

        return result;
    }
}

module.exports = Page;