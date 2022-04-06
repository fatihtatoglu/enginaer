"use strict";

const glob = require("glob");
const path = require("path");

class PathHelper {

    /**
     * @param {string} basePath 
     * @param {strig|string[]} config 
     * @returns {string[]}
     */
    toPath(basePath, config) {
        var paths = [];
        if (Array.isArray(config)) {
            config.forEach((c) => {
                paths = paths.concat(glob.sync(path.join(basePath, c)));
            });
        }
        else if (typeof config === "string") {
            paths = glob.sync(path.join(basePath, config));
        }

        return paths;
    }
}

module.exports = PathHelper;