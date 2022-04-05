"use strict";

const BasePageVisitor = require("../../src/lib/pageVisitor");

class DateVisitor extends BasePageVisitor {

    constructor() {
        super("date");
    }

    visit(page) {
        var dateString = page.get("date");
        var date = new Date(Date.parse(dateString));

        page.set("date", date);
        // page.set("publish-date", date.toISOString());
        // page.set("publish-date-localformat", date.toLocaleDateString("en-US"));
        // page.set("publish-date-title", date.toString("en-US"));
    }
}

module.exports = DateVisitor;