"use strict";

const BasePageVisitor = require("../../src/lib/pageVisitor");

class TagVisitor extends BasePageVisitor {

    constructor() {
        super("tag");
    }

    visit(page) {
        if (!page.has("tags")) {
            return;
        }

        var tagString = page.get("tags");

        var tags = tagString.split(" ").map(v => {
            return v.replace(/\_/g, " ");
        });

        page.set("tags", tags);
    }
}

module.exports = TagVisitor;