"use strict";

module.exports = {
    "separator": function () {
        return this.role === "separator";
    },
    "hasChildren": function () {
        return this.children && this.children.length > 0;
    },
    "url": function () {
        if (this.url) {
            return this.url.toString();
        }

        return "javascript:;";
    },
    "menu": function () {
        var menu = [];

        var posts = {
            "title": "Posts",
            "children": [],
            "order": 9999
        };
        this.pages.forEach((page) => {
            let menuItem = {
                "title": page["title"],
                "url": page["permalink"],
                "order": page["order"],
                "date": page["date"]
            };

            if (page["published"] !== "true") {
                menuItem["disabled"] = true;
                delete menuItem["url"];
            }

            let layout = page["layout"];
            if (layout === "page" || layout === "archive") {
                menu.push(menuItem);
            }
            else if (layout === "post") {
                posts.children.push(menuItem);
            }
        });

        posts.children.sort((a, b) => { return new Date(a["date"]) - new Date(b["date"]); });
        menu.push(posts);

        return menu.sort((a, b) => a["order"] - b["order"]);
    },
    "tagList": function () {
        var tags = [];

        this.pages.forEach((page) => {
            page.tags.forEach((t) => {

                var index = tags.findIndex((v, i) => {
                    if (v["tag"] === t) {
                        return i;
                    }
                });

                if (index === -1) {
                    var tag = {
                        "tag": t,
                        "list": [{
                            "name": page["name"],
                            "title": page["title"],
                            "url": page["permalink"],
                            "date": page["date"],
                            "published": page["published"]
                        }]
                    };

                    tags.push(tag);
                }
                else {
                    tags[index]["list"].push({
                        "name": page["name"],
                        "title": page["title"],
                        "url": page["permalink"],
                        "date": page["date"],
                        "published": page["published"]
                    });
                }
            });
        });

        return tags;
    }
};