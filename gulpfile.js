/* eslint-disable */

/**
 * Module dependencies.
 */
const _ = require('lodash');
const fs = require('fs');
const defaultAssets = require('./server/config/assets/default');
const testAssets = require('./server/config/assets/test');
const testConfig = require('./server/config/env/test');
const glob = require('glob');
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const runSequence = require('run-sequence');
const plugins = gulpLoadPlugins({
  rename: {
    'gulp-angular-templatecache': 'templateCache',
  },
});
const wiredep = require('wiredep').stream;
const path = require('path');

const argv = require('yargs').argv;


// Local settings
let changedTestFiles = [];

// Set NODE_ENV to 'test'
gulp.task('env:test', () => {
  process.env.NODE_ENV = 'test';
});

// Set NODE_ENV to 'development'
gulp.task('env:dev', () => {
  process.env.NODE_ENV = 'development';
});

// Set NODE_ENV to 'production'
gulp.task('env:prod', () => {
  process.env.NODE_ENV = 'production';
});

// ESLint JS linting task
gulp.task('eslint', () => {
  const assets = _.union(
    defaultAssets.server.gulpConfig,
    defaultAssets.server.allJS,
    testAssets.tests.server
  );

  return gulp.src(assets)
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format());
});

// wiredep task to default
gulp.task('wiredep', () => gulp.src('config/assets/default.js')
  .pipe(wiredep({
    ignorePath: '../../',
  }))
  .pipe(gulp.dest('config/assets/')));

// wiredep task to production
gulp.task('wiredep:prod', () => gulp.src('config/assets/production.js')
  .pipe(wiredep({
    ignorePath: '../../',
    fileTypes: {
      js: {
        replace: {
          css(filePath) {
            const minFilePath = filePath.replace('.css', '.min.css');
            const fullPath = path.join(process.cwd(), minFilePath);
            if (!fs.existsSync(fullPath)) {
              return `'${filePath}',`;
            } else {
              return `'${minFilePath}',`;
            }
          },
          js(filePath) {
            const minFilePath = filePath.replace('.js', '.min.js');
            const fullPath = path.join(process.cwd(), minFilePath);
            if (!fs.existsSync(fullPath)) {
              return `'${filePath}',`;
            } else {
              return `'${minFilePath}',`;
            }
          },
        },
      },
    },
  }))
  .pipe(gulp.dest('config/assets/')));

// Copy local development environment config example
gulp.task('copyLocalEnvConfig', () => {
  const src = [];
  const renameTo = 'local-development.js';

  // only add the copy source if our destination file doesn't already exist
  if (!fs.existsSync(`config/env/${renameTo}`)) {
    src.push('config/env/local.example.js');
  }

  return gulp.src(src)
  // .pipe(plugins.rename(renameTo))
    .pipe(gulp.dest('config/env'));
});

// Mocha tests task
gulp.task('mocha', (done) => {
  // Open mongoose connections
  let mongooseService = require('./server/config/lib/mongoose');
  let testSuites = undefined;

  let options = Object.keys(argv);
  let availableTests = Object.keys(testAssets.tests);
  for (let key in availableTests) {
    const testSuite = availableTests[key];
    if(options.includes(testSuite)){
      testSuites = changedTestFiles.length ? changedTestFiles : testAssets.tests[testSuite];
    }
  }

  if(testSuites === undefined){
    testSuites = changedTestFiles.length ? changedTestFiles : testAssets.tests.server;

  }

  let error;

  // Connect mongoose
  mongooseService.connect(function (db) {
    // Load mongoose models
    mongooseService.loadModels();

    console.log('testSuites', testSuites);

    gulp.src(testSuites)
      .pipe(plugins.mocha({
        reporter: 'spec',
        timeout: 10000
      }))
      .on('error', function (err) {
        // If an error occurs, save it
        error = err;
      })
      .on('end', function () {
        mongooseService.disconnect(function (err) {
          if (err) {
            console.log('Error disconnecting from database: ', db.databaseName);
            console.log(err);
          } else {
            console.log('disconnecting');
          }

          return done(error);
        });
      });
  });
});

// Prepare istanbul coverage test
gulp.task('pre-test', () =>
  // Display coverage for all server JavaScript files
  gulp.src(defaultAssets.server.allJS)
  // Covering files
    .pipe(plugins.istanbul())
    // Force `require` to return covered files
    .pipe(plugins.istanbul.hookRequire()));

// Run istanbul test and write report
gulp.task('mocha:coverage', ['pre-test', 'mocha'], () => {
  const testSuites = changedTestFiles.length ? changedTestFiles : testAssets.tests.server;

  return gulp.src(testSuites)
    .pipe(plugins.istanbul.writeReports({
      reportOpts: { dir: './coverage/server' },
    }));
});

// Drops the MongoDB database, used in e2e testing
gulp.task('dropdb', (done) => {
  // Use mongoose configuration
  let mongooseService = require('./server/config/lib/mongoose');

  mongooseService.connect((db) => {
    db.dropDatabase((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Successfully dropped db: ', db.databaseName);
      }
      mongooseService.disconnect(done);
    });
  });
});

// Lint CSS and JavaScript files.
gulp.task('lint', (done) => {
  runSequence(['eslint'], done);
});

// Lint project files and minify them into two production files.
gulp.task('build', (done) => {
  runSequence('env:dev', 'wiredep:prod', 'lint', done);
});

gulp.task('test:server', (done) => {
  runSequence('env:test', ['copyLocalEnvConfig', 'dropdb'], 'mocha', done);
});

// Watch all server files for changes & run server tests (test:server) task on changes
gulp.task('test:server:watch', (done) => {
  runSequence('test:server', 'watch:server:run-tests', done);
});

gulp.task('test:coverage', (done) => {
  runSequence('env:test', ['copyLocalEnvConfig', 'dropdb'], 'lint', 'mocha:coverage', done);
});
