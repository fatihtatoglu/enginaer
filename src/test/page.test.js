"use strict";

require("./helper");

const Page = require("../lib/page");
const BasePageVisitor = require("../lib/pageVisitor");

const { expect } = require("chai");
require('chai').should();

describe("gulp-enginaer-page", () => {
    describe("validate", () => {
        it("should return an error when the file does not start with metadata section.", () => {

            // Arrange
            var content = `# Heading

            I really like using Markdown.
            
            I think I'll use it to format all of my documents from now on.`;

            var file = createFile(content, "sample.md");

            var page = new Page(file);

            // Act
            var error = page.validate();

            // Assert
            error.should.not.null;
            error.message.should.be.string("The file must be started with metadata section.");
        });

        it("should return null when the is valid.", () => {
            var content = `---
            # Heading

            I really like using Markdown.
            
            I think I'll use it to format all of my documents from now on.`;

            var file = createFile(content, "valid-file.md");

            var page = new Page(file);

            // Act
            var error = page.validate();

            // Assert
            expect(error).undefined;
        });

        it("should return an error when the super class returns an error message.", () => {

            // Arrange
            var file;
            var page = new Page(file);

            // Act
            var error = page.validate();

            // Assert
            error.should.not.null;
            error.message.should.be.string("The file must be provided.");
        });
    });

    describe("process", () => {
        it("should return HTML content when process the page.", () => {

            // Arrange
            let content = getContent();

            let expectedHTML = `<h1>Heading</h1>
<p>I really like using Markdown.</p>
<p>I think I&#39;ll use it to format all of my documents from now on.</p>
<h2>Heading2</h2>
<p>Curabitur malesuada, nibh eget ornare venenatis, sapien massa rutrum arcu, a euismod ex risus vel tortor. Aliquam quis posuere ligula. Integer nec euismod ante. Cras malesuada a nisi sit amet laoreet.</p>`;

            let file = createFile(content, "sample.md");
            let page = new Page(file);

            // Act
            page.validate();
            page.process();

            // Assert
            page.content.should.to.be.string(expectedHTML);
        });

        it("should fill metadata Map when process the page.", () => {
            // Arrange
            let content = getContent();
            let file = createFile(content, "sample.md");
            let page = new Page(file);

            // Act
            page.validate();
            page.process();

            // Assert
            page.get("layout").should.to.be.string("page");
            page.get("published").should.to.be.string("true");
            page.get("author").should.to.be.string("Fatih Tatoğlu");
            page.get("permalink").should.to.be.string("about.html");
        });

        it("should return an error when mandatory metadata is missing.", () => {
            // Arrange
            let content = getMissingMatadataContent();
            let file = createFile(content, "sample.md");
            let page = new Page(file);

            // Act
            page.validate();
            let error = page.process();

            // Assert
            error.should.not.null;
            error.message.should.be.string("The mandatory metadata is missing.");
        });

        it("should not return an error when process is successfully completed", function () {
            // Arrange
            let content = getContent();
            let file = createFile(content, "sample.md");
            let page = new Page(file);

            // Act
            page.validate();
            let result = page.process();

            // Assert
            expect(result).undefined;
        });

        it("should trim metadata key when has whitespaces.", () => {
            // Arrange
            let content = `---
            layout: page
            published: false
            author: Fatih Tatoğlu
            permalink: ./post/sample.html
            ---
            # Heading`;

            let file = createFile(content, "sample.md");
            let page = new Page(file);

            // Act
            page.validate();
            page.process();

            // Assert
            page.get("layout").should.to.be.string("page");
            page.get("published").should.to.be.string("false");
            page.get("author").should.to.be.string("Fatih Tatoğlu");
            page.get("permalink").should.to.be.string("./post/sample.html");
        });

        it("should ignore metadata with empty key.", () => {
            // Arrange
            let content = `---
                layout: page
                published: false
                author: Fatih Tatoğlu
                permalink: ./post/sample.html
                ---
                # Heading`;

            let file = createFile(content, "sample.md");
            let page = new Page(file);

            // Act
            page.validate();
            page.process();

            // Assert
            page.has("").should.false;
        });
    });

    describe("accept visitor", () => {

        class TitleVisitor extends BasePageVisitor {

            #regex = /<h1\s*.*>(.*)<\/h1>/g;

            visit(page) {
                var value = this.#regex.exec(page.content);
                if (value.length > 0) {
                    page.set("title", value[1]);
                }
            }
        }

        class ErrorVisitor extends BasePageVisitor {
            visit(_page) {
                return new Error("Test error.");
            }
        }

        it("should add metadata when visitor accepted.", function () {
            // Arrange
            var content = getContent();
            var file = createFile(content, "sample.md");
            var page = new Page(file);
            var visitor = new TitleVisitor();

            // Act
            page.validate();
            page.process();
            var result = page.accept(visitor);

            // Assert
            expect(result).undefined;

            page.has("title").should.be.true;
            page.get("title").should.be.string("Heading");
        });

        it("should return error when an error occured accepting a visitor.", () => {
            // Arrange
            var content = getContent();
            var file = createFile(content, "sample.md");
            var page = new Page(file);
            var visitor = new ErrorVisitor();

            // Act
            page.validate();
            page.process();
            var error = page.accept(visitor);

            // Assert
            error.should.not.null;
            error.message.should.be.string("Test error.");
        });
    });

    describe("published", () => {
        const tests = [
            {
                args: `---
layout: page
published: true
author: Author
date: 2000-01-01
permalink: sample.html
---
# Test`, expected: true, name: "'true'"
            },
            {
                args: `---
layout: page
published: false
author: Author
date: 2000-01-01
permalink: sample.html
---
# Test`, expected: false, name: "'false'"
            },
            {
                args: `---
layout: page
published: no
author: Author
date: 2000-01-01
permalink: sample.html
---
# Test`, expected: false, name: "'no'"
            },
            {
                args: `---
layout: page
published: yes
author: Author
date: 2000-01-01
permalink: sample.html
---
# Test`, expected: false, name: "'yes'"
            },
            {
                args: `---
layout: page
published: 
author: Author
date: 2000-01-01
permalink: sample.html
---
# Test`, expected: false, name: "blank"
            }
        ];

        tests.forEach(({ args, expected, name }) => {

            it(`should return ${expected} when the pusblied key is ${name}.`, () => {
                // Arrange
                let content = args;

                let file = createFile(content, "sample.md");
                let page = new Page(file);

                // Act
                page.validate();
                page.process();

                // Assert
                page.published.should.be.equal(expected);
            });

        });
    });
});