'use strict';

const gulp = require('gulp');
const mocha = require('gulp-mocha');
const jshint = require('gulp-jshint');
const stylish = require('jshint-stylish');
const istanbul = require('gulp-istanbul');
const packageJSON = require('./package.json');
const { jshintConfig } = packageJSON;

gulp.task('lint', () => gulp.src(['./*.js', 'routes/**/*.js', 'test/**/*.js', 'src/**/*.js'])
  .pipe(jshint(jshintConfig))
  .pipe(jshint.reporter(stylish)));

gulp.task('unittest', () => gulp.src(['*.js', 'routes/**/*.js', 'src/**/*.js'])
  .pipe(istanbul()) // Covering files
  .pipe(istanbul.hookRequire()) // Force `require` to return covered files
  .on('finish', () => {
    gulp.src(['test/*.test.js'])
      .pipe(mocha({ reporter: 'nyan' }))
      .pipe(istanbul.writeReports());
  }));

// @ts-ignore
gulp.task('test', ['unittest']);

// @ts-ignore
gulp.task('default', ['lint', 'test']);
