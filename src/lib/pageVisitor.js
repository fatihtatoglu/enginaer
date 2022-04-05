"use strict";

class BasePageVisitor {

    /**
     * @type {string}
     */
    #name;

    constructor(name) {
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
        return undefined;
    }
}

module.exports = BasePageVisitor;