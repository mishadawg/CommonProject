const gulp = require('gulp'),
    sass = require('gulp-sass')(require('sass')),
    browserSync = require('browser-sync'),
    // cleancss = require('gulp-clean-css'),
    clean = require('gulp-clean'),
    svgSprite = require('gulp-svg-sprite'),
    autoprefixer = require('gulp-autoprefixer'),
    pug = require('gulp-pug'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpDebug = require('gulp-debug'),
    fs = require('fs'),
    path = require('path'),
    mergeJson = require('gulp-merge-json'),
    notify = require('gulp-notify'),       // всплывающие уведомления
    imagemin = require('gulp-imagemin'),	 // минификация изображений
    newer = require('gulp-newer'),        // ограничение выборки для ускорения компиляции
    duration = require('gulp-duration'),     // время выполнения
    include = require('gulp-include'),
    plumber = require('gulp-plumber'),
    babel = require('gulp-babel')
    // del = require('del');

//paths
let local = './';
let html = 'html/'
let buildFolder = local + 'build/';
let sourceFolder = local + 'assets/';

let project = {
    build: {
        root: buildFolder,
        html: html,
        css: buildFolder + 'css/',
        fonts: buildFolder + 'fonts/',
        js: buildFolder + 'js/',
        img: buildFolder + 'img/',
    },
    src: {
        js: [
            sourceFolder + 'js/**/*.{js,json}',
            '!' + sourceFolder + 'js/libs/*.js'
        ],
        root: sourceFolder,
        jsonDir: sourceFolder + 'data/',
        json: sourceFolder + 'data/**/*.json',
        dataJson: sourceFolder + "temp/data.json",
        temp: sourceFolder + "temp",
        img: [
            sourceFolder + 'img/**/*.*',
            '!' + sourceFolder + 'img/sprite/*.*',
            '!' + sourceFolder + 'img/icons/*.*',
        ],
        pug: [
            sourceFolder + 'pug/*.pug',
        ],
        pugSrc: [
            sourceFolder + 'pug/**/*.pug',
            sourceFolder + 'pug/*.pug'
        ],
        icons: sourceFolder + 'img/icons/**/*.svg',
        sass: [sourceFolder + 'sass/*.sass', sourceFolder + 'sass/pages/*.sass'],
        css: sourceFolder + 'css/*.css',
        sassSrc: [
            sourceFolder + 'sass/*.sass',
            sourceFolder + 'sass/*.scss',
            sourceFolder + 'sass/**/*.scss',
            sourceFolder + 'sass/**/*.sass',
        ],
        fonts: sourceFolder + 'fonts/**/*.*',
        jsLibs: sourceFolder + 'js/libs/*.js',
        globalIncludefiles: './' + sourceFolder + 'sass/global/include/',
    },
};

// Local Server
gulp.task('browser-sync', function () {
    browserSync({
        startPath: '/html',
        server: {
            baseDir: local
        },
        notify: false,
        open: true // set true to automatically open browser folder localhost:3000
        // online: false, // Work offline without internet connection
        // tunnel: true, tunnel: 'projectname', // Demonstration page: http://projectname.localtunnel.me
    })
});

function bsReload(done) { browserSync.reload(); done(); };

// pug
gulp.task('pug:data', function () {
    return gulp.src(project.src.json)
        .pipe(mergeJson({
            fileName: 'data.json',
            edit: function (json, file) {
                let filename = path.basename(file.path),
                    primaryKey = filename.replace(path.extname(filename), ''),
                    data = { "data": {} };

                data["data"][primaryKey] = json;
                return data;
            }
        }))
        .pipe(gulp.dest(project.src.temp));
});

gulp.task('bsReload', function (done) {
    browserSync.reload();
    done();
});

gulp.task('pug',
    gulp.series(
        'pug:data',
        function buildHTML() {
            return gulp.src(project.src.pug)
                .pipe(pug({
                    pretty: true,
                    data: JSON.parse(fs.readFileSync(project.src.dataJson))
                }))
                .pipe(gulp.dest(project.build.html))
        },
        'bsReload'
    )
);

let options = {
    libs: [
        './node_modules/',
        project.src.globalIncludefiles
    ]
}

// Custom Styles
gulp.task('styles', function () {
    return gulp.src(project.src.sass)
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded',
            includePaths: options.libs
        }))
        //.pipe(gulpDebug({title: "sass"})) //uncomment to see compiled files
        //.pipe(cleancss()) // uncomment for styles minification
        .pipe(autoprefixer({
            grid: true,
            overrideBrowserslist: ['last 30 versions']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(project.build.css))
        .pipe(browserSync.stream())
});

// css
gulp.task('stylesCss', function() {
    gulp.src(['assets/css/*.css'])
        .pipe(gulp.dest('build/css'))
});

//fonts
gulp.task('fonts', function () {
    return gulp.src(project.src.fonts)
        .pipe(newer(project.build.fonts))
        .pipe(gulp.dest(project.build.fonts))
});

//svg-sprites
gulp.task("svgSprite", function () {
    return gulp
        .src([project.src.icons])
        .pipe(
            svgSprite({
                mode: {
                    stack: {
                        sprite: "../icons/icons.svg",
                        // example: true,
                    },
                },
            })
        )
        .pipe(gulp.dest(project.build.img));
});

//img
gulp.task('img', function () {
    return gulp.src(project.src.img)
        .pipe(newer(project.build.img))
        .pipe(gulpDebug({ 'title': '- img' }))
        .pipe(imagemin({ progressive: true }))
        .pipe(duration('img time'))
        .pipe(gulp.dest(project.build.img))
});

//js
gulp.task('js', function () {
    return gulp.src(project.src.js, { since: gulp.lastRun('js') })
        .pipe(plumber(
            notify.onError({
                message: '<%= error.message %>',
                title: 'Js Task Error!'
            })))
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-private-methods']
        }))
        .pipe(gulpDebug({ 'title': '- js' }))
        .pipe(duration('js time'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(project.build.js));
});


//js libs
gulp.task('jsLibs', function () {
    return gulp.src(project.src.jsLibs)
        .pipe(include({
            extensions: 'js',
            hardFail: true,
            separateInputs: true,
            includePaths: [
                __dirname + '/node_modules'
            ]
        }))
        .pipe(gulp.dest(project.build.js))
});

gulp.task('watch', function () {
    gulp.watch(project.src.sassSrc, gulp.parallel('styles'));
    gulp.watch(project.src.sassSrc, gulp.parallel('stylesCss'));
    gulp.watch(project.src.json, gulp.parallel('pug'));
    gulp.watch(project.src.pugSrc, gulp.parallel('pug'));
    gulp.watch(project.src.fonts, gulp.series('fonts'))
    gulp.watch(project.src.img, gulp.parallel('img', 'bsReload'));
    gulp.watch(project.src.jsLibs, gulp.parallel('jsLibs', 'bsReload'));
    gulp.watch(project.src.js, gulp.series('js', 'bsReload'))
    gulp.watch(project.src.icons, gulp.parallel('svgSprite'));
});

// очистка папки с финальной сборкой
// gulp.task('clean', function () {
//     return del([buildFolder, local + '*.html'])
// });

// очистка папки html
gulp.task('clean-html', () => {
    return gulp
        .src('html/*.html', {read: false})
        .pipe(clean());
});

gulp.task('build', gulp.series(gulp.parallel(gulp.series('fonts', 'styles'), gulp.series('jsLibs', 'js'), 'img', 'svgSprite', 'pug')));

gulp.task('bitrix', gulp.series(gulp.parallel(gulp.series('fonts', 'styles'), gulp.series('jsLibs', 'js'), 'img', 'svgSprite')));

gulp.task('default', gulp.series(gulp.parallel(gulp.series('fonts', 'styles'), gulp.series('jsLibs', 'js'), 'browser-sync', 'img', 'svgSprite', 'stylesCss', 'pug', 'watch')));
