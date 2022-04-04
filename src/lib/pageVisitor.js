"use strict";

class BasePageVisitor {

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