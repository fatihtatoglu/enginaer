"use strict";

require("./helper");

const Template = require("../lib/template");

const { expect } = require("chai");
require('chai').should();

describe("gulp-enginaer-template", () => {
    describe("validate", () => {
        it("should return undefined when the is valid.", () => {

            // Arrange
            var content = `<html>
            </html>`;

            var file = createFile(content, "valid-file.mustache");

            var template = new Template(file);

            // Act
            var result = template.validate();

            // Assert
            expect(result).undefined;
        });

        it("should return an error when the file extension is not '.mustache'.", () => {

            // Arrange
            var content = `<html>
            </html>`;

            var file = createFile(content, "valid-file.html");

            var template = new Template(file);

            // Act
            var error = template.validate();

            // Assert
            error.should.not.null;
            error.message.should.be.string("Only mustache templates are supported. The file extention must be '.mustache'.");
        });

        it("should return an error when the super class returns an error message.", () => {

            // Arrange
            var file;
            var template = new Template(file);

            // Act
            var error = template.validate();

            // Assert
            error.should.not.null;
            error.message.should.be.string("The file must be provided.");
        });
    });

    describe("process", () => {
        it("should set template content to content property when is processed.", () => {

            // Arrange
            var expectedContent = `<!DOCTYPE html>
<html>
<body>

<h1>My First Heading</h1>
<p>My first paragraph.</p>

</body>
</html>`;

            var file = createFile(expectedContent, "template.mustache");
            var template = new Template(file);

            // Act
            template.validate();
            template.process();

            // Assert
            template.content.should.equal(expectedContent);
        });
    });
});