"use strict";

class BasePageVisitor {

    /**
     * Changes the page object.
     * @param {Page} page The page object.
     * @returns {Error | undefined}
     */
    visit(page, setMetadata) {
        return undefined;
    }
}

module.exports = BasePageVisitor;