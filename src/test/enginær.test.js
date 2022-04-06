"use strict";

require("./helper");

const Enginar = require("../enginær");

const { expect, assert } = require("chai");
require('chai').should();

describe("gulp-enginaer", () => {

    describe("configuration", () => {

        it("should throw an error when config is missing.", () => {

            // Arrange
            var config;
            var enginaer;

            // Act & Assert
            assert.throws(() => {
                enginaer = new Enginar(config);
            }, Error, "The config must be provided!");
        });

        it("should throw an error when mandatory is missing in the config.", () => {

            // Arrange
            var config = {};
            var enginaer;

            // Act & Assert
            assert.throws(() => {
                enginaer = new Enginar(config);
            }, Error, "The one of the mandatory key is missing in the config.");
        });

        it("should throw an error when page config does not have 'path' key.", () => {

            // Arrange
            var config = {
                "base": __dirname,
                "site-language": "en",
                "site-culture": "en-US",
                "site-title-prefix": "Enginær - ",
                "site-name": "Enginær Demo",
                "base-url": "https://blog.tatoglu.net/enginaer/",
                "page": {},
                "template": {}
            };
            var enginaer;

            // Act & Assert
            assert.throws(() => {
                enginaer = new Enginar(config);
            }, Error, "The page config must have 'path' key!");
        });

        it("should throw an error when template config does not have 'path' key.", () => {

            // Arrange
            var config = {
                "base": __dirname,
                "site-language": "en",
                "site-culture": "en-US",
                "site-title-prefix": "Enginær - ",
                "site-name": "Enginær Demo",
                "base-url": "https://blog.tatoglu.net/enginaer/",
                "page": {
                    "path": "*.md"
                },
                "template": {}
            };
            var enginaer;

            // Act & Assert
            assert.throws(() => {
                enginaer = new Enginar(config);
            }, Error, "The template config must have 'path' key!");
        });
    });
});