import gulp from 'gulp';
import util from 'gulp-util';
import typings from 'gulp-typings';
import eslint from 'gulp-eslint';
import tslint from 'gulp-tslint';
import mocha from 'gulp-mocha';
import typescript from 'gulp-typescript';
import sourcemaps from 'gulp-sourcemaps';
import uglify from 'gulp-uglify';
import spawnMocha from 'gulp-spawn-mocha';
import remapIstanbul from 'remap-istanbul/lib/gulpRemapIstanbul';
import coveralls from 'gulp-coveralls';
import minimist from 'minimist';
import path from 'path';
import del from 'del';
import tsconfigGlob from 'tsconfig-glob';
import rseq from 'run-sequence';

const options = {
  string: [
    'libpath',
    'distpath',
    'reporter',
  ],
  boolean: [
    'verbose',
    'quiet',
    'force',
  ],
  alias: {
    libpath: [ 'l', 'lib' ],
    distpath: [ 'd', 'dist' ],
    reporter: [ 'r' ],
    verbose: [ 'v' ],
    quiet: [ 'q' ],
  },
  default: {
    libpath: path.resolve(__dirname, 'lib'),
    distpath: path.resolve(__dirname, 'dist'),
    reporter: 'spec',
    verbose: false,
    quiet: false,
    force: false,
  },
};

const args = minimist(process.argv, options);

const files = {
  bundle: 'rxobj.js',
  stats: 'stats.json',
  tsconfig: 'tsconfig.json',
  typings: 'typings.json',
  webpack: 'webpack.config.js',
};

const config = {
  verbose: args.verbose,
  quiet: args.quiet,
  force: args.force,
  reporter: args.reporter,
  paths: {
    typings: path.resolve(__dirname, 'typings'),
    src: path.resolve(__dirname, 'src'),
    test: path.resolve(__dirname, 'test'),
    build: path.resolve(__dirname, 'build'),
    lib: args.libpath,
    dist: args.distpath,
    coverage: path.resolve(__dirname, 'coverage'),
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
gulp.task('test', [ 'mocha' ]);

// npm test task
gulp.task('npm:test', [ 'dist' ]);
// npm start task
gulp.task('npm:start', [ 'default' ]);

gulp.task('config', () => {
  util.log('Gulp Config:', JSON.stringify(config, null, 2));
});

gulp.task('help', () => {
  /* eslint-disable max-len */
  util.log(`
*** rxobj Gulp Help ***

Command Line Overrides:
  ${ util.colors.cyan('--verbose, -v') }                 : print webpack module details and stats after bundling (${ util.colors.magenta(config.verbose) })
  ${ util.colors.cyan('--quiet, -q') }                   : do not print any extra build details (${ util.colors.magenta(config.quiet) })
  ${ util.colors.cyan('--libpath, --lib, -l') }   ${ util.colors.yellow('<path>') } : override ${ util.colors.yellow('lib') } directory (${ util.colors.magenta(config.paths.lib) })
  ${ util.colors.cyan('--distpath, --dist, -d') } ${ util.colors.yellow('<path>') } : override ${ util.colors.yellow('dist') } directory (${ util.colors.magenta(config.paths.dist) })
  ${ util.colors.cyan('--reporter, -r') }         ${ util.colors.yellow('<name>') } : mocha test reporter (${ util.colors.magenta(config.reporter) })
                                  ${ [ 'spec', 'list', 'progress', 'dot', 'min' ].map((x) => util.colors.magenta(x)).join(', ') }

Tasks:
  ${ util.colors.cyan('gulp help') } will print this help text
  ${ util.colors.cyan('gulp config') } will print the gulp build configuration

  ${ util.colors.cyan('gulp') } perform a default build
  ${ util.colors.cyan('gulp test') } perform a default test execution

  ${ util.colors.cyan('gulp npm:start') } called by ${ util.colors.cyan('npm start') }
  ${ util.colors.cyan('gulp npm:test') } called by ${ util.colors.cyan('npm test') }

  ${ util.colors.cyan('gulp clean') } will delete all files in ${ util.colors.magenta(config.paths.typings) }, ${ util.colors.magenta(config.paths.build) }, ${ util.colors.magenta(config.paths.lib) }, ${ util.colors.magenta(config.paths.dist) }
       ${ [ 'typings', 'build', 'lib', 'dist', 'all' ].map((x) => util.colors.cyan(`clean:${ x }`)).join(', ') }

  ${ util.colors.cyan('gulp typings') } will install typescript definition files via the typings utility

  ${ util.colors.cyan('gulp tsconfig') } will expand ${ util.colors.yellow('filesGlob') } in ${ util.colors.magenta(files.tsconfig) }

  ${ util.colors.cyan('gulp lint') } will lint the source files with ${ util.colors.yellow('eslint') } and ${ util.colors.yellow('tslint') }
       ${ [ 'es', 'ts', 'all' ].map((x) => util.colors.cyan(`lint:${ x }`)).join(', ') }

  ${ util.colors.cyan('gulp mocha') } will build and run mocha against the tests in ${ util.colors.magenta(config.paths.test) }

  ${ util.colors.cyan('gulp watch') } will watch for changes in ${ util.colors.magenta(config.paths.src) } and ${ util.colors.magenta(config.paths.test) } and run mocha (alias for ${ util.colors.cyan('watch:mocha') })
  ${ util.colors.cyan('gulp watch:lint') } will watch for changes in ${ util.colors.magenta(config.paths.src) } and ${ util.colors.magenta(config.paths.test) } and run the linters

  ${ util.colors.cyan('gulp typescript') } will compile typescript files to ${ util.colors.magenta(config.paths.build) }
       ${ [ 'typings', 'lib', 'lib:ES5', 'lib:ES6', 'all' ].map((x) => util.colors.cyan(`typescript:${ x }`)).join(', ') }
`);
  /* eslint-enable max-len */
});

gulp.task('clean', [ 'clean:all' ]);

gulp.task('clean:all', [ 'clean:typings', 'clean:build', 'clean:lib', 'clean:dist', 'clean:coverage' ]);

gulp.task('clean:typings', () => {
  log('Cleaning', util.colors.magenta(config.paths.typings));

  del.sync([
    path.join(config.paths.typings, '**', '*'),
  ], { force: true });
});

gulp.task('clean:build', () => {
  log('Cleaning', util.colors.magenta(config.paths.build));

  del.sync([
    config.paths.build,
  ], { force: true });
});

gulp.task('clean:lib', () => {
  // numeric variable names make sense here
  /* eslint-disable id-match*/
  const es5 = path.resolve(config.paths.lib, 'ES5');
  const es6 = path.resolve(config.paths.lib, 'ES6');

  log('Cleaning', util.colors.magenta(es5), 'and', util.colors.magenta(es6));

  del.sync([
    es5,
    es6,
  ], { force: true });
  /* eslint-enable id-match*/
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

gulp.task('typings', () => {
  log('Installing typings...');

  return gulp
    .src(path.resolve(__dirname, files.typings))
    .pipe(typings());
});

gulp.task('tsconfig', [ 'typings' ], () => {
  log('Globbing', util.colors.magenta(path.resolve(__dirname, files.tsconfig)));

  return tsconfigGlob({ indent: 2 });
});

gulp.task('typescript', [ 'typescript:all' ]);

gulp.task('typescript:all', [ 'typescript:lib', 'typescript:bundle', 'typescript:typings' ]);

gulp.task('typescript:lib', [ 'typescript:lib:ES5', 'typescript:lib:ES6' ]);

gulp.task('typescript:lib:ES5', () => {
  log('Compiling to ES5...');

  const tsProject = typescript.createProject(files.tsconfig, {
    target: 'ES5',
  });

  const outDir = path.resolve(config.paths.build, 'lib', 'ES5');

  return gulp
    .src([
      path.resolve(config.paths.typings, 'index.d.ts'),
      path.resolve(config.paths.src, '**', '*.ts'),
      `!${ path.resolve(config.paths.src, '**', '*.d.ts') }`,
    ], { base: path.resolve(config.paths.src) })
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.', { sourceRoot: path.resolve(config.paths.src) }))
    .pipe(gulp.dest(outDir));
});

gulp.task('typescript:lib:ES6', () => {
  log('Compiling to ES6...');

  const tsProject = typescript.createProject(files.tsconfig, {
    target: 'ES6',
    module: 'es2015',
  });

  const outDir = path.resolve(config.paths.build, 'lib', 'ES6');

  return gulp
    .src([
      // we need to punt out es6-shim definitions, so we have to kind of
      // hack the globbing
      path.resolve(config.paths.typings, '**', 'index.d.ts'),
      `!${ path.resolve(config.paths.typings, 'index.d.ts') }`,
      `!${ path.resolve(config.paths.typings, '**', 'es6-shim', 'index.d.ts') }`,
      path.resolve(config.paths.src, '**', '*.ts'),
      `!${ path.resolve(config.paths.src, '**', '*.d.ts') }`,
    ], { base: path.resolve(config.paths.src) })
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.', { sourceRoot: path.resolve(config.paths.src) }))
    .pipe(gulp.dest(outDir));
});

gulp.task('typescript:bundle', () => {
  log('Compiling to js bundle...');

  const tsProject = typescript.createProject(files.tsconfig, {
    module: 'system',
    outFile: files.bundle,
  });

  const outDir = path.resolve(config.paths.build, 'bundle');

  return gulp
    .src([
      path.resolve(config.paths.typings, 'index.d.ts'),
      path.resolve(config.paths.src, '**', '*.ts'),
      `!${ path.resolve(config.paths.src, '**', '*.d.ts') }`,
    ], { base: path.resolve(config.paths.src) })
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(uglify())
    .pipe(sourcemaps.write('.', { sourceRoot: path.resolve(config.paths.src) }))
    .pipe(gulp.dest(outDir));
});

gulp.task('typescript:typings', () => {
  log('Compiling typescript typings...');

  const tsProject = typescript.createProject(files.tsconfig, {
    target: 'ES5',
    module: 'system',
    declaration: true,
    outFile: files.bundle,
  });

  return gulp
    .src([
      path.resolve(config.paths.typings, 'index.d.ts'),
      path.resolve(config.paths.src, 'rxobj.ts'),
    ])
    .pipe(tsProject())
    .dts
    .pipe(gulp.dest(path.resolve(config.paths.build, 'typings')));
});

gulp.task('typescript:test', () => {
  log('Compiling typescript tests...');

  const tsProject = typescript.createProject(files.tsconfig, {
    target: 'ES5',
  });

  const outDir = path.resolve(config.paths.build);

  return gulp
    .src([
      path.resolve(config.paths.typings, 'index.d.ts'),
      path.resolve(config.paths.src, '**', '*.ts'),
      `!${ path.resolve(config.paths.src, '**', '*.d.ts') }`,
      path.resolve(config.paths.test, '**', '*.ts'),
    ], { base: '.' })
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write('.', { sourceRoot: path.resolve('.') }))
    .pipe(gulp.dest(outDir));
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
      `!${ path.resolve(config.paths.src, '**', '*.d.ts') }`,
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

gulp.task('mocha', (done) => {
  rseq('tsconfig', 'typescript:test', 'mocha:run', done);
});

gulp.task('mocha:run', () => {
  log('Testing with mocha...');

  const reporter = config.quiet ? 'dot' : config.reporter;

  return gulp
    .src([
      path.resolve(config.paths.build, 'test', '**', '*.spec.js'),
    ], { read: false })
    .pipe(mocha({ reporter }));
});

gulp.task('mocha:coverage', () => {
  log('Covering tests with mocha and istanbul...');

  const reporter = config.quiet ? 'dot' : config.reporter;

  return gulp
    .src([
      path.resolve(config.paths.build, 'test', '**', '*.spec.js'),
    ], { read: false })
    .pipe(spawnMocha({
      recursive: true,
      istanbul: true,
      reporter,
    }));
});

gulp.task('istanbul:remap', () => {
  log('Remapping istanbul coverage results to typescript files...');
  return gulp
    .src([
      path.resolve(config.paths.coverage, 'coverage.json'),
    ])
    .pipe(remapIstanbul({
      reports: {
        'json': path.resolve(config.paths.coverage, 'coverage.json'),
        'lcovonly': path.resolve(config.paths.coverage, 'lcov.info'),
        'html': path.resolve(config.paths.coverage, 'lcov-report'),
      },
      fail: true,
    }));
});

gulp.task('coveralls', [ 'coveralls:upload' ]);

gulp.task('coveralls:upload', (done) => {
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

gulp.task('watch:lint', () => {
  rseq('lint', () => null);

  log('Watching for changes...');

  return gulp
    .watch([
      path.join(config.paths.src, '**', '*.ts'),
      path.join(config.paths.test, '**', '*.ts'),
      path.join(__dirname, '*.js'),
    ], () => rseq('lint', () => null));
});

gulp.task('watch:test', () => {
  rseq('tsconfig', 'typescript:test', () => null);

  log('Watching for changes...');

  return gulp
    .watch([
      path.join(config.paths.src, '**', '*.ts'),
      `!${ path.resolve(config.paths.src, '**', '*.d.ts') }`,
      path.join(config.paths.test, '**', '*.ts'),
    ], () => {
      rseq('typescript:test', () => null);
    });
});

gulp.task('watch:mocha', () => {
  rseq('tsconfig', 'typescript:test', 'mocha:run', () => null);

  log('Watching for changes...');

  return gulp
    .watch([
      path.join(config.paths.src, '**', '*.ts'),
      `!${ path.resolve(config.paths.src, '**', '*.d.ts') }`,
      path.join(config.paths.test, '**', '*.ts'),
    ], () => {
      rseq('typescript:test', 'mocha:run', () => null);
    });
});

gulp.task('dist', [ 'clean' ], (done) => {
  rseq('tsconfig', 'typescript:test', 'mocha:coverage', 'istanbul:remap', 'lint', 'typescript', 'dist:deploy', done);
});

gulp.task('dist:deploy', [ 'dist:deploy:bundle', 'dist:deploy:typings', 'dist:deploy:lib' ]);

gulp.task('dist:deploy:bundle', () => {
  const target = path.resolve(config.paths.build, 'bundle', `${ files.bundle }*`);

  log('Deploying', util.colors.magenta(target), 'to', util.colors.magenta(config.paths.dist));

  gulp
    .src([
      target,
    ])
    .pipe(gulp.dest(config.paths.dist));
});

gulp.task('dist:deploy:typings', () => {
  const target = path.resolve(config.paths.build, 'typings', util.replaceExtension(files.bundle, '.d.ts'));

  log('Deploying', util.colors.magenta(target), 'to', util.colors.magenta(config.paths.dist));

  gulp
    .src([
      target,
    ])
    .pipe(gulp.dest(config.paths.dist));
});

gulp.task('dist:deploy:lib', () => {
  const target = path.resolve(config.paths.build, 'lib');

  log('Deploying', util.colors.magenta(target), 'to', util.colors.magenta(target));

  gulp
    .src([
      path.resolve(target, '**', '*'),
    ])
    .pipe(gulp.dest(path.resolve(config.paths.dist, 'lib')));
});
