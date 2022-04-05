"use strict";

const BasePageVisitor = require("../../src/lib/pageVisitor");

class TitleVisitor extends BasePageVisitor {
    constructor() {
        super("title");
    }

    visit(page) {

        var regex = /<h1\s*.*>(.*)<\/h1>/g;
        var value = regex.exec(page.content);

        if (value.length > 0) {
            page.set("title", value[1]);
        }
    }
}

module.exports = TitleVisitor;