import gulp from 'gulp';
import browserSync from 'browser-sync';
import clean from 'gulp-clean';
import svgSprite from 'gulp-svg-sprite';
import autoprefixer from 'gulp-autoprefixer';
import pug from 'gulp-pug';
import sourcemaps from 'gulp-sourcemaps';
import gulpDebug from 'gulp-debug';
import fs from 'fs';
import path from 'path';
import mergeJson from 'gulp-merge-json';
import notify from 'gulp-notify';
import imagemin from 'gulp-imagemin';
import newer from 'gulp-newer';
import duration from 'gulp-duration';
import include from 'gulp-include';
import plumber from 'gulp-plumber';
import babel from 'gulp-babel';
import { compileString } from 'sass';
import through from 'through2';

process.env.SASS_DEPRECATION_WARNINGS = '0';

// Конфигурация путей
const config = {
    local: './',
    buildFolder: 'dist/build/',
    sourceFolder: 'dist/assets/',
    
    get paths() {
        const build = this.buildFolder;
        const src = this.sourceFolder;
        
        return {
            build: {
                root: build,
                html: build + 'html/',
                css: build + 'css/',
                fonts: build + 'fonts/',
                js: build + 'js/',
                img: build + 'img/',
                downloads: build + 'downloads/',
            },
            src: {
                root: src,
                jsonDir: src + 'data/',
                json: src + 'data/**/*.json',
                dataJson: src + 'temp/data.json',
                temp: src + 'temp',
                img: [
                    src + 'img/**/*.*',
                    '!' + src + 'img/sprite/*.*',
                    '!' + src + 'img/icons/*.*',
                ],
                pug: {
                    pages: src + 'pug/pages/*.pug',
                    all: [
                        src + 'pug/**/*.pug',
                        src + 'pug/*.pug'
                    ]
                },
                icons: src + 'img/icons/**/*.svg',
                sass: {
                    main: [src + 'styles/*.sass', src + 'styles/pages/*.sass'],
                    all: [
                        src + 'styles/**/*.sass',
                        src + 'styles/**/*.scss'
                    ]
                },
                css: src + 'css/*.css',
                fonts: src + 'fonts/**/*.*',
                js: {
                    main: [
                        src + 'js/**/*.{js,json}',
                        '!' + src + 'js/libs/*.js'
                    ],
                    libs: src + 'js/libs/*.js'
                },
                globalIncludefiles: './' + src + 'styles/global/include/',
                downloads: src + 'downloads/**/*.*',
            }
        };
    }
};

const project = config.paths;

// Обработчик ошибок
const errorHandler = (taskName) => 
    plumber({
        errorHandler: notify.onError({
            title: `Ошибка в задаче ${taskName}`,
            message: '<%= error.message %>'
        })
    });

// Local Server
gulp.task('browser-sync', function (done) {
    browserSync({
        server: {
            baseDir: './dist/build/' 
        },
        startPath: '/html/', 
        notify: false,
        open: true
    });
    done();
});

function bsReload(done) { 
    browserSync.reload(); 
    done(); 
}

// Pug data preparation
gulp.task('pug:data', function () {
    return gulp.src(project.src.json)
        .pipe(errorHandler('pug:data'))
        .pipe(mergeJson({
            fileName: 'data.json',
            edit: function (json, file) {
                const filename = path.basename(file.path);
                const primaryKey = filename.replace(path.extname(filename), '');
                const data = { "data": {} };

                data["data"][primaryKey] = json;
                return data;
            }
        }))
        .pipe(gulp.dest(project.src.temp));
});

// Pug compilation
gulp.task('pug', function () {
    // Проверяем существование data.json
    if (!fs.existsSync(project.src.dataJson)) {
        console.log('Data.json не найден, сначала выполните pug:data');
        return gulp.src(project.src.pug.pages)
            .pipe(errorHandler('pug'))
            .pipe(pug({
                pretty: true,
                data: {}
            }))
            .pipe(gulp.dest(project.build.html))
            .pipe(browserSync.stream());
    }

    return gulp.src(project.src.pug.pages)
        .pipe(errorHandler('pug'))
        .pipe(pug({
            pretty: true,
            data: JSON.parse(fs.readFileSync(project.src.dataJson))
        }))
        .pipe(gulp.dest(project.build.html))
        .pipe(browserSync.stream());
});

const sassOptions = {
    libs: [
        './node_modules/',
        project.src.globalIncludefiles
    ]
};

// Copy CSS libraries
gulp.task('copy-css-libs', function () {
    const cssSources = [
        'dist/assets/styles/global/helpers/*.css',
    ];
    
    return gulp.src(cssSources, { allowEmpty: true })
        .pipe(errorHandler('copy-css-libs'))
        .pipe(gulp.dest(project.build.css + 'global/helpers/'))
        .pipe(browserSync.stream());
});

// Custom Styles - упрощенная версия
gulp.task('styles', function () {
    return gulp.src(project.src.sass.main)
        .pipe(errorHandler('styles'))
        .pipe(sourcemaps.init())
        .pipe(through.obj(function (file, enc, cb) {
            if (file.isNull()) return cb(null, file);
            if (file.isStream()) return cb(new Error('Streaming not supported'));
            
            console.log('📂 Обрабатываю файл:', file.path);
            console.log('📁 Директория файла:', path.dirname(file.path));
            
            try {
                // Получаем базовый путь для стилей
                const baseStylesPath = path.join(process.cwd(), 'dist/assets/styles');
                console.log('📍 Базовый путь стилей:', baseStylesPath);
                
                const result = compileString(file.contents.toString(), {
                    style: 'expanded',
                    loadPaths: [
                        baseStylesPath,  // dist/assets/styles
                        path.join(baseStylesPath, 'global'),
                        path.join(baseStylesPath, 'global/helpers'),
                        path.join(baseStylesPath, 'pages'),
                        './node_modules',
                        process.cwd()
                    ],
                    quietDeps: true,
                    silenceDeprecations: ['import'],
                    syntax: 'indented',
                });
                
                file.contents = Buffer.from(result.css);
                file.extname = '.css';
                console.log('✅ Успешно скомпилирован:', file.path);
                cb(null, file);
            } catch (error) {
                console.error('❌ Ошибка в:', file.path);
                console.error('💡 Сообщение:', error.message);
                
                // Показываем проблемную строку
                const content = file.contents.toString();
                const lines = content.split('\n');
                console.error('📄 Первые 3 строки файла:');
                lines.slice(0, 3).forEach((line, i) => {
                    console.error(`   ${i + 1}: ${line}`);
                });
                
                cb(error);
            }
        }))
        .pipe(autoprefixer({
            grid: true,
            overrideBrowserslist: ['last 30 versions']
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(project.build.css))
        .pipe(browserSync.stream());
});

// CSS copy
gulp.task('stylesCss', function() {
    return gulp.src(project.src.css)
        .pipe(errorHandler('stylesCss'))
        .pipe(gulp.dest(project.build.css))
        .pipe(browserSync.stream());
});

// Fonts copy
gulp.task('fonts', function () {
    return gulp.src(project.src.fonts)
        .pipe(errorHandler('fonts'))
        .pipe(newer(project.build.fonts))
        .pipe(gulp.dest(project.build.fonts));
});

// SVG sprites
gulp.task('svgSprite', function () {
    return gulp.src(project.src.icons)
        .pipe(errorHandler('svgSprite'))
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../icons/icons.svg",
                },
            },
        }))
        .pipe(gulp.dest(project.build.img));
});

// Images optimization
gulp.task('img', function () {
    return gulp.src(project.src.img)
        .pipe(errorHandler('img'))
        .pipe(newer(project.build.img))
        .pipe(gulpDebug({ title: '- img' }))
        .pipe(imagemin({ progressive: true }))
        .pipe(duration('img time'))
        .pipe(gulp.dest(project.build.img));
});

// JavaScript compilation
gulp.task('js', function () {
    return gulp.src(project.src.js.main, { since: gulp.lastRun('js') })
        .pipe(errorHandler('js'))
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/preset-env'],
            plugins: [
                '@babel/plugin-proposal-class-properties', 
                '@babel/plugin-proposal-private-methods'
            ]
        }))
        .pipe(gulpDebug({ title: '- js' }))
        .pipe(duration('js time'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(project.build.js));
});

// JavaScript libraries
gulp.task('jsLibs', function () {
    return gulp.src(project.src.js.libs)
        .pipe(errorHandler('jsLibs'))
        .pipe(include({
            extensions: 'js',
            hardFail: true,
            separateInputs: true,
            includePaths: [
                process.cwd() + '/node_modules'
            ]
        }))
        .pipe(gulp.dest(project.build.js));
});

// Copy files for download
gulp.task('downloads', function () {
    return gulp.src(project.src.downloads)
        .pipe(errorHandler('downloads'))
        .pipe(newer(project.build.downloads))
        .pipe(gulpDebug({ title: 'downloads' }))
        .pipe(gulp.dest(project.build.downloads))
        .pipe(browserSync.stream ? browserSync.stream() : gulp.dest(project.build.downloads));
});

// Watch task
gulp.task('watch', function () {
    gulp.watch(project.src.sass.all, gulp.parallel('styles'));
    gulp.watch(project.src.css, gulp.parallel('stylesCss'));
    gulp.watch(project.src.json, gulp.series('pug:data', 'pug'));
    gulp.watch(project.src.pug.all, gulp.parallel('pug'));
    gulp.watch(project.src.fonts, gulp.series('fonts', bsReload));
    gulp.watch(project.src.img, gulp.series('img', bsReload));
    gulp.watch(project.src.js.libs, gulp.series('jsLibs', bsReload));
    gulp.watch(project.src.js.main, gulp.series('js', bsReload));
    gulp.watch(project.src.icons, gulp.series('svgSprite', bsReload));
    gulp.watch(project.src.downloads, gulp.series('downloads', bsReload));
});

// Clean tasks
gulp.task('clean-html', function () {
    return gulp.src(project.build.html + '*.html', { read: false, allowEmpty: true })
        .pipe(clean());
});

gulp.task('clean-build', function () {
    return gulp.src(project.build.root, { read: false, allowEmpty: true })
        .pipe(clean());
});

// Build tasks
gulp.task('build', gulp.series(
    'clean-build',
    gulp.parallel(
        'fonts', 
        'styles', 
        'stylesCss',
        'copy-css-libs',
        gulp.series('jsLibs', 'js'), 
        'img', 
        'svgSprite', 
        'downloads',
        gulp.series('pug:data', 'pug')
    )
));

gulp.task('bitrix', gulp.series(
    gulp.parallel(
        'fonts', 
        'styles', 
        'stylesCss',
        gulp.series('jsLibs', 'js'), 
        'img', 
        'svgSprite',
        'downloads',
    )
));

// Default task
gulp.task('default', gulp.series(
    gulp.parallel(
        'fonts', 
        'styles', 
        'stylesCss',
        'copy-css-libs',
        gulp.series('jsLibs', 'js'), 
        'img', 
        'svgSprite', 
        'downloads',
        gulp.series('pug:data', 'pug')
    ),
    gulp.parallel(
        'browser-sync',
        'watch'
    )
));