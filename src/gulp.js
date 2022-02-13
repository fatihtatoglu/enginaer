const { series, parallel, src, dest } = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const babel = require("gulp-babel");
const concat = require("gulp-concat");


function build(){
    return src(["lib/**/*.js","!gulp.js"])
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat("all.js"))
    .pipe(sourcemaps.write("."))
    .pipe(dest("publish"));
}

exports.default = build;