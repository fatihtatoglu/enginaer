"use strict";

require("./helper");

const PathHelper = require("../lib/pathHelper");

require('chai').should();

describe("gulp-enginaer-pathHelper", () => {
    it("should resolve paths of the given glob.", () => {

        // Arrange
        var basePath = "../test/";
        var globPath = "./page/*.md";
        var pathHelper = new PathHelper();

        // Act
        var result = pathHelper.toPath(basePath, globPath);

        // Arrange
        result.should.not.empty;
        result.should.have.lengthOf(7);
        result.should.contains("../test/page/about.md");
        result.should.contains("../test/page/sample-post.md");
    });

    it("should resolve path of the give glob array.", () => {

        // Arrange
        var basePath = "../test/";
        var globPath = ["./page/*.md", "./template/*.mustache"];
        var pathHelper = new PathHelper();

        // Act
        var result = pathHelper.toPath(basePath, globPath);

        // Arrange
        result.should.not.empty;
        result.should.contains("../test/page/about.md");
        result.should.contains("../test/page/degisim_basliyor.md");
        result.should.contains("../test/page/index.md");
        result.should.contains("../test/page/intro.md");
        result.should.contains("../test/page/kendime-notlar.md");
        result.should.contains("../test/page/pages_test.md");
        result.should.contains("../test/page/sample-post.md");
        result.should.contains("../test/template/_footer.mustache");
        result.should.contains("../test/template/_menu.mustache");
        result.should.contains("../test/template/archive.mustache");
        result.should.contains("../test/template/page.mustache");
        result.should.contains("../test/template/post.mustache");
    });
});