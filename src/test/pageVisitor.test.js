"use strict";

require("./helper");

const Page = require("../lib/page");
const Resource = require("../lib/resource");
const BasePageVisitor = require("../lib/pageVisitor");

const { assert, expect } = require("chai");

require('chai').should();

describe("gulp-enginaer-pageVisitor", () => {

    it("should throw an exception when initialize without name", () => {

        // Arrange
        var visitor;

        // Act & Assert
        assert.throws(() => {
            visitor = new BasePageVisitor();
        }, Error, "The name is required for page visitor!");
    });

    it("should return an error when the page object is invalid", () => {

        // Arrange
        var visitor = new BasePageVisitor("base");
        var page;

        // Act 
        var error = visitor.visit(page);

        // Assert
        error.should.not.null;
        error.message.should.be.string("The page object must be provided!");
    });

    it("should return an error when the page object is not an instance of Page.", () => {

        // Arrange
        var visitor = new BasePageVisitor("base");
        var file = createFile("sample file", "test.md");
        var page = new Resource(file);

        console.log(page);

        // Act 
        var error = visitor.visit(page);

        // Assert
        error.should.not.null;
        error.message.should.be.string("The page object must be provided!");
    });

    it("should work fine when everthing is valid", () => {

        // Arrange
        var visitorName = "base-test";
        var visitor = new BasePageVisitor(visitorName);
        var file = createFile("sample file", "test.md");
        var page = new Page(file);

        console.log(page);

        // Act 
        var result = visitor.visit(page);

        // Assert
        visitor.name.should.string(visitorName);
        expect(result).undefined;
    });
});