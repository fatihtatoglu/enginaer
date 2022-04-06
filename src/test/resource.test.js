"use strict";

require("./helper");

const Resource = require("../lib/resource");

const Vinyl = require("vinyl");
const Readable = require("stream").Readable;

require('chai').should();

describe("gulp-enginaer-resource", () => {
    describe("validate", () => {
        it("should return an error when the file is not provided.", () => {

            // Arrange
            var file;
            var resource = new Resource(file);

            // Act
            var error = resource.validate();

            // Assert
            error.should.not.null;
            error.message.should.be.string("The file must be provided.");
        });

        it("should return an error when the file is empty.", () => {

            // Arrange
            var file = new Vinyl();
            var resource = new Resource(file);

            // Act
            var error = resource.validate();

            // Assert
            error.should.not.null;
            error.message.should.be.string("The file is empty.");
        });

        it("should return an error when the file is streaming.", () => {

            // Arrange
            var content = "";

            var stream = new Readable();
            stream.push(content);
            stream.push(null);

            var file = new Vinyl({
                cwd: "",
                base: undefined,
                path: "stream.md",
                contents: stream
            });
            var resource = new Resource(file);

            // Act
            var error = resource.validate();

            // Assert
            error.should.not.null;
            error.message.should.be.string("The stream is not supported.");
        });
    });

    describe("name", () => {
        it("should return name of the file when getting name property.", () => {

            // Arrange
            var expectedName = "test-template-name";
            var file = createFile("<html></html>", expectedName + ".mustache");
            var resource = new Resource(file);

            // Act
            var name = resource.name;

            // Assert
            name.should.to.be.string(expectedName);
        });
    });
});