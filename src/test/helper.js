"use strict";

const Vinyl = require("vinyl");

global.createFile = function (content, fileName) {
    return new Vinyl({
        cwd: "",
        base: undefined,
        path: fileName,
        contents: Buffer.from(content)
    });
};

global.getContent = function () {
    return `---
layout: page
published: true
author: Fatih Tatoğlu
permalink: about.html
date: 2000-01-01 00:00:00
---
# Heading

I really like using Markdown.
            
I think I'll use it to format all of my documents from now on.

## Heading2

Curabitur malesuada, nibh eget ornare venenatis, sapien massa rutrum arcu, a euismod ex risus vel tortor. Aliquam quis posuere ligula. Integer nec euismod ante. Cras malesuada a nisi sit amet laoreet.`;
}

global.getMissingMatadataContent = function () {
    return `---
layout: page
published: true
author: Fatih Tatoğlu
permalink: about.html
---
# Heading

I really like using Markdown.
            
I think I'll use it to format all of my documents from now on.

## Heading2

Curabitur malesuada, nibh eget ornare venenatis, sapien massa rutrum arcu, a euismod ex risus vel tortor. Aliquam quis posuere ligula. Integer nec euismod ante. Cras malesuada a nisi sit amet laoreet.`;
}