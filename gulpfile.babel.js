import { ForkCheckerPlugin } from 'awesome-typescript-loader';
import clone from 'clone';
import del from 'del';
import gulp from 'gulp';
import coveralls from 'gulp-coveralls';
import eslint from 'gulp-eslint';
import istanbul from 'gulp-istanbul';
import mocha from 'gulp-mocha';
import plumber from 'gulp-plumber';
import tslint from 'gulp-tslint';
import util from 'gulp-util';
import minimist from 'minimist';
import path from 'path';
import remapIstanbul from 'remap-istanbul/lib/gulpRemapIstanbul';
import rseq from 'run-sequence';
import through from 'through';
import webpack from 'webpack';
import webpackStream from 'webpack-stream';

import * as webpackConfig from './webpack.config';
import * as webpackTestConfig from './test/webpack.config';

const options = {
  string: [
    'buildpath',
    'distpath',
    'covpath',
    'reporter',
  ],
  boolean: [
    'verbose',
    'quiet',
    'force',
  ],
  alias: {
    buildpath: [ 'b', 'build' ],
    distpath: [ 'd', 'dist' ],
    covpath: [ 'c', 'cov' ],
    reporter: [ 'r' ],
    verbose: [ 'v' ],
    quiet: [ 'q' ],
  },
  default: {
    buildpath: path.resolve(__dirname, 'build'),
    distpath: path.resolve(__dirname, 'dist'),
    covpath: path.resolve(__dirname, 'coverage'),
    reporter: 'spec',
    verbose: false,
    quiet: false,
    force: false,
  },
};

const args = minimist(process.argv, options);

const config = {
  verbose: args.verbose,
  quiet: args.quiet,
  force: args.force,
  reporter: args.reporter,
  files: {
    bundle: 'rxobj.js',
    testBundle: 'rxobj.spec.js',
    stats: 'stats.json',
    tsconfig: 'tsconfig.json',
    coverage: 'coverage-final.json',
  },
  paths: {
    src: path.resolve(__dirname, 'src'),
    test: path.resolve(__dirname, 'test'),
    build: args.buildpath,
    dist: args.distpath,
    coverage: args.covpath,
  },
};

function log(...items) {
  if (config.quiet === false) {
    // Reflect is not available in the gulp file
    // eslint-disable-next-line prefer-reflect
    util.log.apply(null, items);
  }
}

if (config.verbose) {
  log('Gulp Config:', JSON.stringify(config, null, 2));
}

// Default build task
gulp.task('default', [ 'help' ]);
// Default test task
gulp.task('test', (done) => {
  rseq('webpack:test', 'mocha', done);
});

// npm test task
gulp.task('npm:test', [ 'dist' ]);
// npm start task
gulp.task('npm:start', [ 'watch' ]);

gulp.task('config', () => {
  util.log('Gulp Config:', JSON.stringify(config, null, 2));
});

gulp.task('help', () => {
  /* eslint-disable max-len */
  util.log(`
*** rxobj Gulp Help ***

Command Line Overrides:
  ${ util.colors.cyan('--verbose, -v') }                   : print more detail
  ${ util.colors.cyan('--quiet, -q') }                     : do not print any extra build details (${ util.colors.magenta(config.quiet) })
  ${ util.colors.cyan('--buildpath, --build, -b') } ${ util.colors.yellow('<path>') } : override ${ util.colors.yellow('build') } directory (${ util.colors.magenta(config.paths.build) })
  ${ util.colors.cyan('--distpath, --dist, -d') }   ${ util.colors.yellow('<path>') } : override ${ util.colors.yellow('dist') } directory (${ util.colors.magenta(config.paths.dist) })
  ${ util.colors.cyan('--covpath, --cov, -c') }     ${ util.colors.yellow('<path>') } : override ${ util.colors.yellow('coverage') } directory (${ util.colors.magenta(config.paths.coverage) })
  ${ util.colors.cyan('--reporter, -r') }           ${ util.colors.yellow('<name>') } : mocha test reporter (${ util.colors.magenta(config.reporter) }) [ ${ [ 'spec', 'list', 'progress', 'dot', 'min' ].map((x) => util.colors.magenta(x)).join(', ') } ]

Tasks:
  ${ util.colors.cyan('gulp help') } will print this help text
  ${ util.colors.cyan('gulp config') } will print the gulp build configuration

  ${ util.colors.cyan('gulp') } perform a default build
  ${ util.colors.cyan('gulp test') } perform a default test execution

  ${ util.colors.cyan('gulp npm:start') } called by ${ util.colors.cyan('npm start') }
  ${ util.colors.cyan('gulp npm:test') } called by ${ util.colors.cyan('npm test') }

  ${ util.colors.cyan('gulp clean') } will delete all files in ${ util.colors.magenta(config.paths.build) }, ${ util.colors.magenta(config.paths.lib) }, ${ util.colors.magenta(config.paths.dist) }, ${ util.colors.magenta(config.paths.coverage) }
       ${ [ 'build', 'dist', 'coverage', 'all' ].map((x) => util.colors.cyan(`clean:${ x }`)).join(', ') }

  ${ util.colors.cyan('gulp lint') } will lint the source files with ${ util.colors.yellow('eslint') } and ${ util.colors.yellow('tslint') }
       ${ [ 'es', 'ts', 'all' ].map((x) => util.colors.cyan(`lint:${ x }`)).join(', ') }

  ${ util.colors.cyan('gulp mocha') } will build and run mocha against the tests in ${ util.colors.magenta(config.paths.test) }

  ${ util.colors.cyan('gulp watch') } will watch for changes in ${ util.colors.magenta(config.paths.src) } and ${ util.colors.magenta(config.paths.test) } and run mocha (alias for ${ util.colors.cyan('watch:mocha') })
  ${ util.colors.cyan('gulp watch:lint') } will watch for changes in ${ util.colors.magenta(config.paths.src) } and ${ util.colors.magenta(config.paths.test) } and run the linters

  ${ util.colors.cyan('gulp webpack') } will compile typescript files to ${ util.colors.magenta(config.paths.build) }
`);
  /* eslint-enable max-len */
});

gulp.task('clean', [ 'clean:all' ]);

gulp.task('clean:all', [ 'clean:build', 'clean:dist', 'clean:coverage', 'clean:gulp' ]);

gulp.task('clean:build', () => {
  log('Cleaning', util.colors.magenta(config.paths.build));

  del.sync([
    config.paths.build,
  ], { force: true });
});

gulp.task('clean:dist', () => {
  log('Cleaning', util.colors.magenta(config.paths.dist));

  del.sync([
    config.paths.dist,
  ], { force: true });
});

gulp.task('clean:coverage', () => {
  log('Cleaning', util.colors.magenta(config.paths.coverage));

  del.sync([
    config.paths.coverage,
  ], { force: true });
});

gulp.task('clean:gulp', () => {
  const target = path.resolve(__dirname, 'gulpfile.js');

  log('Cleaning', util.colors.magenta(target));

  del.sync([
    target,
  ], { force: true });
});

gulp.task('webpack', [ 'webpack:debug' ]);
gulp.task('webpack:all', [ 'webpack:debug', 'webpack:release', 'webpack:test' ]);

gulp.task('webpack:debug', () => {
  log('building', util.colors.yellow('debug'), 'bundle...');

  const cfg = clone(webpackConfig);

  cfg.plugins[0].definitions.DEBUG = true;

  return gulp
    .src([ path.resolve(config.paths.src, 'rxobj.ts') ])
    .pipe(webpackStream(cfg))
    .pipe(gulp.dest(path.resolve(config.paths.build, 'debug')));
});

gulp.task('webpack:release', () => {
  log('building', util.colors.yellow('release'), 'bundle...');

  const cfg = clone(webpackConfig);

  cfg.externals = {
    'rxjs': true,
  };

  cfg.plugins[0].definitions.RELEASE = true;

  cfg.plugins.push(
    new ForkCheckerPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(true),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  );

  return gulp
    .src([ path.resolve(config.paths.src, 'rxobj.ts') ])
    .pipe(webpackStream(cfg))
    .pipe(gulp.dest(path.resolve(config.paths.build, 'release')));
});

gulp.task('webpack:test', () => {
  log('building', util.colors.yellow('test'), 'bundle...');

  const cfg = clone(webpackTestConfig);

  return gulp
    .src([ path.resolve(config.paths.test, 'rxobj.spec.ts') ])
    .pipe(webpackStream(cfg))
    .pipe(gulp.dest(path.resolve(config.paths.build, 'test')));
});

gulp.task('lint', [ 'lint:all' ]);

gulp.task('lint:all', [ 'lint:es', 'lint:ts' ]);

gulp.task('lint:es', () => {
  log('Running ESLint...');

  return gulp
    .src([
      path.resolve(config.paths.src, '**', '*.js'),
      path.resolve(config.paths.test, '**', '*.js'),
      path.resolve(__dirname, '*.js'),
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError());
});

gulp.task('lint:ts', () => {
  log('Running TSLint...');

  return gulp
    .src([
      path.resolve(config.paths.src, '**', '*.ts'),
      path.resolve(config.paths.test, '**', '*.ts'),
    ])
    .pipe(tslint({
      formatter: 'verbose',
    }))
    .pipe(tslint.report({
      emitError: true,
      summarizeFailureOutput: true,
    }));
});

gulp.task('mocha', [ 'mocha:coverage' ]);

gulp.task('mocha:test', () => {
  log('Running tests with mocha...');

  const reporter = config.quiet ? 'dot' : config.reporter;

  return gulp
    .src([
      path.resolve(config.paths.build, 'test', config.files.testBundle),
    ], { read: false })
    .pipe(mocha({ reporter }));
});

gulp.task('mocha:coverage', () => {
  log('Running and covering tests with mocha and istanbul...');

  const reporter = config.quiet ? 'dot' : config.reporter;

  return gulp
    .src([
      path.resolve(config.paths.build, 'test', config.files.testBundle),
    ], { read: false })
    .pipe(mocha({ reporter }))
    .pipe(istanbul.writeReports({
      coverageVariable: webpackTestConfig.coverageVariable,
      reporters: [ 'lcov', 'json', 'html' ],
    }))
    .on('end', () => {
      log('Remapping istanbul coverage results to typescript files...');

      gulp
        .src([
          path.resolve(config.paths.coverage, config.files.coverage),
        ])
        .pipe(remapIstanbul({
          reports: {
            'json': path.resolve(config.paths.coverage, config.files.coverage),
            'lcovonly': path.resolve(config.paths.coverage, 'lcov.info'),
            'html': path.resolve(config.paths.coverage, 'lcov-report'),
            'text-summary': null,
          },
          fail: true,
        }));
    });
});

gulp.task('coveralls', [ 'coveralls:upload' ]);

gulp.task('coveralls:upload', (done) => {
  // eslint-disable-next-line no-process-env
  if (process.env.CI || config.force === true) {
    log('Uploading coverage results to coveralls...');

    gulp
      .src(path.join(config.paths.coverage, '**', 'lcov.info'))
      .pipe(coveralls())
      .on('end', done);
  } else {
    // eslint-disable-next-line callback-return
    done(`Use ${ util.colors.cyan('--force') } to upload coverage data manually`);
  }
});

gulp.task('watch', [ 'watch:mocha' ]);

gulp.task('watch:lint:run', (done) => {
  rseq('lint', () => {
    log('Watching for changes...');

    done();
  });
});

// supply done param so that the task doesn't 'finish'
// eslint-disable-next-line no-unused-vars
gulp.task('watch:lint', [ 'watch:lint:run' ], (done) => {
  log('watching files and linting...');

  return gulp
    .watch([
      path.join(config.paths.src, '**', '*.ts'),
      path.join(config.paths.test, '**', '*.ts'),
      path.join(__dirname, '*.js'),
    ], [ 'watch:lint:run' ]);
});

// supply done param so that the task doesn't 'finish'
// eslint-disable-next-line no-unused-vars
gulp.task('watch:mocha', [ 'clean:build' ], (done) => {
  log('watching', util.colors.yellow('test'), 'build...');

  const reporter = config.quiet ? 'dot' : config.reporter;

  const cfg = clone(webpackTestConfig);

  cfg.watch = true;

  return gulp
    .src([ path.resolve(config.paths.test, 'rxobj.spec.ts') ])
    .pipe(plumber())
    .pipe(webpackStream(cfg))
    .pipe(gulp.dest(path.resolve(config.paths.build, 'test')))
    .pipe(through((file) => {
      log('Testing', file.path, '...');

      // reset the coverage var so we get fresh coverage results
      global[webpackTestConfig.coverageVariable] = null;

      gulp
        .src(file.path, { read: false })
        .pipe(plumber())
        .pipe(mocha({ reporter }));
        // .pipe(istanbul.writeReports({
        //   coverageVariable: webpackTestConfig.coverageVariable,
        //   reporters: [ 'lcov', 'json', 'html' ],
        // }))
        // .on('end', () => {
        //   log('Remapping istanbul coverage results to typescript files...');

        //   gulp
        //     .src([
        //       path.resolve(config.paths.coverage, config.files.coverage),
        //     ])
        //     .pipe(remapIstanbul({
        //       reports: {
        //         'json': path.resolve(config.paths.coverage, config.files.coverage),
        //         'lcovonly': path.resolve(config.paths.coverage, 'lcov.info'),
        //         'html': path.resolve(config.paths.coverage, 'lcov-report'),
        //         'text-summary': null,
        //       },
        //       fail: true,
        //     }));
        // });
    }));
});

gulp.task('dist', [ 'clean' ], (done) => {
  rseq(
    'lint',
    'webpack:test',
    'mocha:coverage',
    'istanbul:remap',
    'webpack:release',
    'dist:deploy',
    done
  );
});

gulp.task('dist:deploy', () => {
  const target = path.resolve(config.paths.build, 'release');

  log('Deploying', util.colors.magenta(target), 'to', util.colors.magenta(config.paths.dist));

  gulp
    .src([
      target,
    ])
    .pipe(gulp.dest(config.paths.dist));
});
