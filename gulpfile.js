"use strict";

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var istanbul = require('gulp-istanbul');
var packageJSON  = require('./package');
var jshintConfig = packageJSON.jshintConfig;

gulp.task('lint', function() {
    return gulp.src(['./*.js', 'routes/**/*.js', 'test/**/*.js', 'src/**/*.js'])
        .pipe(jshint(jshintConfig))
        .pipe(jshint.reporter(stylish));
});

gulp.task('unittest', function () {
    return gulp.src(['*.js', 'routes/**/*.js', 'src/**/*.js'])
        .pipe(istanbul()) // Covering files
        .pipe(istanbul.hookRequire()) // Force `require` to return covered files
        .on('finish', function () {
            gulp.src(['test/*.test.js'])
                .pipe(mocha({reporter: 'nyan'}))
                .pipe(istanbul.writeReports());
        });
});

gulp.task('test', ['unittest' ]);

gulp.task('default', ['lint', 'test']);
