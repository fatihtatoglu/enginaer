"use strict";

const Page = require("./page");

/**
 * @interface
 */
class BasePageVisitor {

    /**
     * @type {string}
     */
    #name;

    constructor(name) {

        if (!name) {
            throw new Error("The name is required for page visitor!");
        }

        this.#name = name;
    }

    /**
     * @type {string}
     */
    get name() {
        return this.#name;
    }

    /**
     * Changes the page object.
     * @param {Page} page The page object.
     * @returns {Error | undefined}
     */
    visit(page) {
        if (!page || !(page instanceof Page)) {
            return new Error("The page object must be provided!");
        }

        return;
    }
}

module.exports = BasePageVisitor;