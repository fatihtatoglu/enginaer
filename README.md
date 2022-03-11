# Enginær

Enginær is a simple **static** website engine.

## Motivation

While developing, my motivation has been to easily publish a new post or a new page, like sending a new commit message to a git repository. In addition, I wanted to develop my Turbo C blog theme.

I like writing blogs, but I cannot take any time. I know writing markdown is so easy and also the markdown document has a human-readable structure. Moreover, markdown documents also support many components that using in HTML documents is not easy such as tables, images, and lists.

## Challenges

Creating a blog engine there are some challenges. The first one is to create an automation for converting markdown documents into HTML documents. For this operation, I am using the **`marked`** library. The second challenge is creating a simple and extendable template system. The **`mustache`** library is the simple and logic-less template engine that is suitable for this challenge.

Apart from all of the other challenges, executing operations in parallel or serial order I need to develop an automated pipeline system. **`gulp`** is a flexible and repetitive system. I selected **`gulp`** and the main part of the project stands a gulp plugin.

![gulp](/docs/gulp.png "gulp") ![markdown](docs/markdown.png "markdown") ![markedjs](/docs/markedjs.png "markedjs") ![mustache](docs/mustache.png "mustache") ![nodejs](docs/nodejs.png "nodejs") ![github actions](docs/actions.png "github actions")

## Usage

The usage of the tool is very easy if you have selected your blog template or blog layout and its style.

### Define Folder Path

In the `gulpfile.js` updating ***Path Declarations*** section is enough.

### Optional Adding Fixer

While generating HTML documents, you could need some special operations such as replacing image paths.

```js
const engine = new Enginær(configPath, templateFolderPath);

engine.registerFixer("header-fixer", function (pageText) {
    var text = pageText;

    text = text.replace("<h1>", "<header><h1>");
    text = text.replace("</h1>", "</h1></header>");

    return text;
});
```

### Optional Adding Template Functions

The **`mustache`** template system does not support if/else conditions. However, it supports some custom tags. You can add these custom tags as a function.

```js
const engine = new Enginær(configPath, templateFolderPath);

engine.registerTemplateFunctionMap("separator", function () {
    return this.role === "separator";
});
```

### config.json

While generating HTML documents with **`mustache`** template and Enginær tools you can change some configurations.

```json
{
    "site-language": "en",
    "site-culture": "en-US",
    "site-title-prefix": "...",
    "site-name": "...",
    "base-url": "..."
}
```

## Execute

After updating `gulpfile.js` and other configurations the system is ready to execute. For executing follow the below steps.

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

