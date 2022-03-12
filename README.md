# Enginær

Enginær is a simple **static** website engine.

## Motivation

While developing, my motivation has been to easily publish a new post or a new page, like sending a new commit message to a git repository. In addition, I wanted to develop my Turbo C blog theme.

I like writing blogs, but I cannot take any time. I know writing markdown is so easy and also the markdown document has a human-readable structure. Moreover, markdown documents also support many components that using in HTML documents is not easy such as tables, images, and lists.

## Challenges

Creating a blog engine there are some challenges. The first one is to create an automation for converting markdown documents into HTML documents. For this operation, I am using the **`marked`** library. The second challenge is creating a simple and extendable template system. The **`mustache`** library is the simple and logic-less template engine that is suitable for this challenge.

Apart from all of the other challenges, executing operations in parallel or serial order I need to develop an automated pipeline system. **`gulp`** is a flexible and repetitive system. I selected **`gulp`** and the main part of the project stands a gulp plugin.

![gulp](docs/gulp.png "gulp") ![markdown](docs/markdown.png "markdown") ![markedjs](docs/markedjs.png "markedjs") ![mustache](docs/mustache.png "mustache") ![nodejs](docs/nodejs.png "nodejs") ![github actions](docs/actions.png "github actions")

## Usage

The usage of the tool is very easy if you have selected your blog template or blog layout and its style.

### Install

```bash
npm install --save-dev enginaer
```

### Import References

First of all import all required references.

```js
const { series, parallel, src, dest } = require("gulp");
const clean = require("gulp-clean");
const replace = require("gulp-replace");
const enginær = require("enginaer");
```

### Set Options

Then to set options the `setOprions` method can be used. The example options are below.

```js
enginær.setOptions({
    "output": "../dist/",

    "asset": {
        "base": "./assets/",
        "path": [
            "./assets/css/*.css",
            "./assets/js/*.js",
            "./assets/img/*.png",
            "./assets/img/*.jpg"
        ]
    },

    "page": {
        "path": "./page/**/*.md",
        "enrichers": [
            {
                "key": "title",
                "type": "raw",
                "handler": function (fileRawContent) {
                    var titleRegex = /<h1>(.*)<\/h1>/g;
                    var titleResult = titleRegex.exec(fileRawContent);

                    return titleResult[1];
                }
            },
            {
                "key": "tags",
                "type": "metadata",
                "handler": function (value) {
                    return value.split().map(v => {
                        return v.replace(/\_/g, " ");
                    });
                }
            },
            {
                "key": "date",
                "type": "metadata",
                "handler": function (value) {
                    return new Date(Date.parse(value));
                }
            }
        ]
    },

    "template": {
        "path": "./template/*.mustache",
        "helpers": {
            "separator": function () {
                return this.role === "separator";
            },
            "hasChildren": function () {
                return this.children && this.children.length > 0;
            },
            "url": function () {
                if (this.url) {
                    return this.url;
                }

                return "javascript:;";
            }
        }
    },

    "config": {
        "site-language": "en",
        "site-culture": "en-US",
        "site-title-prefix": "Enginær - ",
        "site-name": "Enginær Demo",
        "base-url": "https://blog.tatoglu.net/enginaer/"
    },

    "marked": {
        breaks: true,
        smartLists: true,
        headerIds: false
    }
});
```

#### Attribute Description

| Attribute | |  | Description | Type |
| :---: | :---: | :---: | :--- | :-- |
| **output** | | | The output folder path | string |
| **asset** | | | The asset object | object |
| | ***base*** | | The base asset folder path | string |
| | ***path*** | | The assets paths. | string, string[] |
| **page** | | | The page object | object |
| | ***path*** | | The page folders paths | string, string[] |
| | ***enrichers*** | | The enricher array | object[] |
| | | *key* | Name of the result object | string |
| | | *type* | Type of the enricher | enum: raw, metadata |
| | | *handler* | The enricher function | Function |
| **template** | | | The template object | object |
| | ***path*** | | The templates paths | string, string[] |
| | ***helpers*** | | The render helper function of the templates | pair<string, Function> |
| **config** | | | The config object | object |
| | ***site-language*** | | The website language | string |
| | ***site-culture*** | | The website culture. This property is also used for date formatting. | string |
| | ***site-title-prefix*** | | The website title prefix | string |
| | ***site-name*** | | The name of the website | string |
| | ***base-url*** | | The website base url | string |
| **marked** | | | The marked configuration. Reference: [markedJS Options](https://marked.js.org/using_advanced#options) | object |

> The string properties are supported [glob](https://gulpjs.com/docs/en/getting-started/explaining-globs/) data type.

### Gulp Steps

The last step for using is defining gulp steps. The below steps are the simple example.

```js
// Gulp Step 1 - Clean old files.
function cleanAll() {
    return src([enginær.outputPath], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

// Gulp Step 2 - Copy all required assets.
function copyAssets() {
    return src(enginær.assetPath, { base: enginær.assetBasePath })
        .pipe(dest(enginær.outputPath));
}

// Gulp Step 3 - Add Pages
function loadPages() {
    return src(enginær.pagePath)
        .pipe(enginær.setPages());
}

// Gulp Step 4 - Add Templates
function loadTemplates() {
    return src(enginær.templatePath)
        .pipe(enginær.setTemplates());
}

// Gulp Step 5 - Generate Output
function generate() {
    return enginær.generate()
        .pipe(replace("<h1>", "<header><h1>"))
        .pipe(replace("</h1>", "</h1></header>"))
        .pipe(replace(/..\/assets\/img\//g, "./img/"))
        .pipe(dest("../dist/"));
}

exports.default = series(
    cleanAll,

    parallel(copyAssets, loadPages, loadTemplates),

    generate
);
```

#### Customize Pipeline

The `enginær.generate` method return file stream. If you want to customize the output, you should add new pipe steps.

The other customization options are `page.enrichers` and `template.helpers`.

##### page.enrichers

This customization step provides adding new key-value pair in the page metadata.

##### template.helpers`

This customization step provides helpers for rendering mustache templates.

## Execute

After creating `gulpfile.js` the system is ready to execute. For executing follow the below steps.

```bash
# Step 1. Install NPM Packages
npm install

# Step 2. Install Gulp CLI
npm install --global gulp-cli

# Step 3. Execute Enginær
gulp
```

That's all. For demo you can visit [Enginær Demo](https://blog.tatoglu.net/enginaer/) site.

## Support

For supporting me, you can add an issue for bug cases or new feature requests.
