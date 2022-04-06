"use strict";

require("./helper");

const Template = require("../lib/template");

const { expect } = require("chai");
const Page = require("../lib/page");
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
            template.validate();

            // Act
            template.process();

            // Assert
            template.content.should.equal(expectedContent);
        });
    });

    describe("execute", () => {
        it("should return template output when is executed.", () => {

            // Arrange
            var pageContent = `---
layout: page
permalink: test.html
published: true
author: Fatih Tatoğlu
date: 2000-01-01
---
# Heading 

Sample content.`;
            var pageFile = createFile(pageContent, "page.md");
            var page = new Page(pageFile);
            page.validate();
            page.process();

            var templateContent = "{{& content}} <h2>Names</h2><ul>{{#list}}<li>{{name}}</li>{{/list}}</ul>";
            var templateContentFile = createFile(templateContent, "template.mustache");
            var template = new Template(templateContentFile);
            template.validate();
            template.process();

            // Act
            var output = template.execute(page, {
                "list": [{ "name": "Fatih" }, { "name": "John" }]
            });

            // Assert
            output.should.be.string(`<h1>Heading</h1>
<p>Sample content.</p>
 <h2>Names</h2><ul><li>Fatih</li><li>John</li></ul>`);
        });

        it("should return template output when executed with partial template.", () => {

            // Arrange
            var pageContent = `---
layout: post
permalink: sample.html
published: true
author: Fatih Tatoğlu
date: 2000-01-03
---
# Sample 

Lorem ipsum sit amet.`;
            var pageFile = createFile(pageContent, "page2.md");
            var page = new Page(pageFile);
            page.validate();
            page.process();

            var templateContent = `<h2>Names</h2>{{#list}}{{> _user}}{{/list}}{{& content}}`;
            var templateContentFile = createFile(templateContent, "template_partial.mustache");
            var template = new Template(templateContentFile);
            template.validate();
            template.process();

            var partialTemplateContent = "<strong>{{name}}</strong>";
            var partialTemplateContentFile = createFile(partialTemplateContent, "_user.mustache");
            var partialTemplate = new Template(partialTemplateContentFile);
            partialTemplate.validate();
            partialTemplate.process();

            // Act
            var output = template.execute(page, {
                "list": [{ "name": "Fatih" }, { "name": "John" }]
            }, {
                "_user": partialTemplate
            });

            // Assert
            output.should.be.string(`<h2>Names</h2><strong>Fatih</strong><strong>John</strong><h1>Sample</h1>
<p>Lorem ipsum sit amet.</p>
`);
        });
    });
});