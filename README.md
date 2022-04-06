# Enginær

Enginær is a simple **static** website engine.

## Motivation

While developing, my motivation has been to easily publish a new post or a new page, like sending a new commit message to a git repository.

I like writing blogs, but I cannot have enough time. I know writing markdown is so easy and also the markdown document has a human-readable structure. Moreover, markdown documents also support many components that using in HTML documents is not easy such as tables, images, and lists.

![Publish Test Project](https://github.com/fatihtatoglu/enginaer/actions/workflows/test.yml/badge.svg
) [![HitCount](https://hits.dwyl.com/fatihtatoglu/enginaer.svg?style=flat-square&show=unique)](http://hits.dwyl.com/fatihtatoglu/enginaer) ![GitHub top language](https://img.shields.io/github/languages/top/fatihtatoglu/enginaer) ![GitHub](https://img.shields.io/github/license/fatihtatoglu/enginaer) ![npm](https://img.shields.io/npm/v/enginaer) [![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=fatihtatoglu_enginaer&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=fatihtatoglu_enginaer) [![Bugs](https://sonarcloud.io/api/project_badges/measure?project=fatihtatoglu_enginaer&metric=bugs)](https://sonarcloud.io/summary/new_code?id=fatihtatoglu_enginaer) [![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=fatihtatoglu_enginaer&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=fatihtatoglu_enginaer)

## Challenges

Creating a blog engine there are some challenges. The first one is to create an automation for converting markdown documents into HTML documents. For this operation, I am using the **`marked`** library. The second challenge is creating a simple and extendable template system. The **`mustache`** library is the simple and logic-less template engine that is suitable for this challenge.

Apart from all of the other challenges, executing operations in parallel or serial order I need to develop an automated pipeline system. **`gulp`** is a flexible and repetitive system. I selected **`gulp`** and the main part of the project stands a gulp plugin.

![gulp](docs/gulp.png "gulp") ![markdown](docs/markdown.png "markdown") ![markedjs](docs/markedjs.png "markedjs") ![mustache](docs/mustache.png "mustache") ![NodeJs](docs/nodejs.png "NodeJs") ![Github Actions](docs/actions.png "Github Actions") ![SonarCloud](docs/sonarcloud.png "SonarCloud") ![Glob](docs/glob.png "Glob")

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
const enginær = require("enginaer");
```

### Configuration

The configuration is very basic and user friendly.

```js
const config = {
    "base": __dirname,
    "page": {
        "path": "./page/**/*.md",
        "visitor": "./page/**/*Visitor.js",
        "marked": {
            breaks: true,
            smartLists: true,
            headerIds: false
        }
    },
    "template": {
        "path": "./template/*.mustache",
        "helpers": "./template/templateHelpers.js"
    },
    "site-language": "en",
    "site-culture": "en-US",
    "site-title-prefix": "Enginær - ",
    "site-name": "Enginær Demo",
    "base-url": "https://blog.tatoglu.net/enginaer/"
};
```

#### Configuration Description

| Attribute | | Description | Type |
| :--- | :---: | :--- | :-- |
| **base** | | The base path of the resources. Usually you can set *__dirname*. | string |
| **page** | | The page object | object |
| | ***path*** | The page folders paths. | glob |
| | ***visitor*** | The page visitors paths.  | glob |
| | ***marked*** | The marked configuration. Reference: [markedJS Options](https://marked.js.org/using_advanced#options) | object |
| **template** | | The template object. | object |
| | ***path*** | The templates paths. | glob |
| | ***helpers*** | The render helper functions paths. | glob |
| **site-language** | | The website language. | string |
| **site-culture** | | The website culture. This property is also used for date formatting. | string |
| **site-title-prefix** | | The website title prefix. | string |
| **site-name** | | The name of the website. | string |
| **base-url** | | The website base url. | string |

For more details about [glob](https://gulpjs.com/docs/en/getting-started/explaining-globs/) data type.

### Execution Steps

After defining the configuration, there are there main steps.

#### Initialization

```js
var enginær = new Enginaer(config);
```

In this step, the engine is initialized. While initilization, if the engine is faced any invalid or missing configuration, will throw an exception.

#### Loading Resources

```js
enginær.load();
```

This step is required for loading mandatory resources validation and processing in the engine. While loading resources engine could throw any exceptions, if the resource is not valid.

The loading steps work in the following order.

1. Templates
2. Template Helpers
3. Page Visitors
4. Pages

#### Generation

```js
enginær.generate();
```

At the end, the engine is ready to generate web site pages.

### Sample Gulpfile

For putting all execution step together the sample gulp file is below.

```js
const outputPath = "../dist/";

// Gulp Step 1 - Clean old files.
function cleanAll() {
    return src(outputPath, { allowEmpty: true })
        .pipe(clean({ force: true }));
}

// Gulp Step 2 - Copy all required assets.
function copyAssets() {
    return src(["./assets/css/*.css",
        "./assets/js/*.js",
        "./assets/img/*.png",
        "./assets/img/*.jpg"], { base: "./assets/" })
        .pipe(dest(outputPath));
}

// Gulp Step 3 - Enginær
function generate() {

    // Initialize enginær engine.
    var enginær = new Enginaer(config);

    // load required resources (templates, template helpers, pages, and page visitors.)
    enginær.load();

    // Generate web site pages.
    return enginær.generate()
        .pipe(dest(outputPath));
}

exports.default = series(
    cleanAll,
    parallel(copyAssets, generate)
);
```

## Customization

The `enginær.generate` method return file stream. If you want to customize the output, you should add new pipe steps.

The other customization options are `Page Visitors` and `Template Helpers`.

### Page Visitors

This customization step provides adding new key-value pair in the page metadata. The page visitors are applied for all pages after loading and for each page object.

The page visitor must be extend from `BasePageVisitor` class.

```js
class BasePageVisitor {
    name: string;
    visit(page:Page):Error | undefined;
}
```

#### Template Helpers

This customization step provides helpers for rendering mustache templates. There is one restriction that must be returns an object such as the below example.

```js
module.exports = {
    "helper-name": function () {
        return "sample-code";
    }
};
```

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
