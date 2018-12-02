var bower = require('./bower.json'),
    concat = require('gulp-concat'),
    exec = require('child_process').exec,
    fs = require('fs'),
    gulp = require('gulp'),
    inquirer = require('inquirer'),
    jshint = require('gulp-jshint'),
    package = require('./package.json'),
    plumber = require('gulp-plumber'),
    replace = require('gulp-replace'),
    semver = require('semver'),
    size = require('gulp-size'),
    uglify = require('gulp-uglify'),
    util = require('gulp-util');
var srcDir = './src/';

/*
 *    Usage : gulp build --types=Bar,Line,Doughnut
 *    Output: - A built Chart.js file with Core and types Bar, Line and Doughnut concatenated together
 *            - A minified version of this code, in Chart.min.js
 */
gulp.task('build', function() {

    // Default to all of the chart types, with Chart.Core first
    var srcFiles = [FileName('Core')],
        isCustom = !!(util.env.types),
        outputDir = (isCustom) ? 'custom' : '.';
    if (isCustom) {
        util.env.types.split(',').forEach(function(type) { return srcFiles.push(FileName(type)); });
    } else {
        // Seems gulp-concat remove duplicates - nice!
        // So we can use this to sort out dependency order - aka include Core first!
        srcFiles.push(srcDir + '*');
    }

    return gulp.src(srcFiles)
        .pipe(plumber())
        .pipe(concat('Chart.js'))
        .pipe(replace('{{ version }}', package.version))
        .pipe(gulp.dest(outputDir))
        .pipe(uglify())
        .pipe(concat('Chart.min.js'))
        .pipe(gulp.dest(outputDir));

    function FileName(moduleName) {
        return srcDir + 'Chart.' + moduleName + '.js';
    }
});

/*
 *    Usage : gulp bump
 *    Prompts: Version increment to bump
 *    Output: - New version number written into package.json & bower.json
 */
gulp.task('bump', function(complete) {
    util.log('Current version:', util.colors.cyan(package.version));
    var choices = ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease'].map(function(versionType) {
        return versionType + ' (v' + semver.inc(package.version, versionType) + ')';
    });
    inquirer.prompt({
        type: 'list',
        name: 'version',
        message: 'What version update would you like?',
        choices: choices
    }, function(res) {
        var increment = res.version.split(' ')[0],
            newVersion = semver.inc(package.version, increment);

        // Set the new versions into the bower/package object
        package.version = newVersion;
        bower.version = newVersion;

        // Write these to their own files, then build the output
        fs.writeFileSync('package.json', JSON.stringify(package, null, 2));
        fs.writeFileSync('bower.json', JSON.stringify(bower, null, 2));

        complete();
    });
});

gulp.task('release', ['build'], function() {
    exec('git tag -a v' + package.version);
});

gulp.task('jshint', function() {
    return gulp.src(srcDir + '*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('library-size', function() {
    return gulp.src('Chart.min.js')
        .pipe(size({
            gzip: true
        }));
});

gulp.task('module-sizes', function() {
    return gulp.src(srcDir + '*.js')
        .pipe(plumber())
        .pipe(uglify())
        .pipe(size({
            showFiles: true,
            gzip: true
        }));
});

gulp.task('watch', function() {
    gulp.watch('./src/*', ['build']);
});

gulp.task('test', ['jshint']);

gulp.task('size', ['library-size', 'module-sizes']);

gulp.task('default', ['build', 'watch']);
