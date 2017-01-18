var gulp = require('gulp');
var gutil = require('gulp-util')
var plugins = require('gulp-load-plugins')();
var glob = require('glob');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var importer = require('sass-importer-npm');
var browserSync = require('browser-sync').create();
var browserify = require('browserify');
var babelify = require('babelify');
var exorcist = require('exorcist');
var watchify = require('watchify');
var through = require('through2');

var config = {
  host: 'nordantech.local:8888',
  debug: true,

  scss: {
    entry: ['./assets/scss/boot.scss'],
    watch: ['./assets/scss/*.scss', './site/patterns/**/*.scss']
  },

  php: {
    watch: [ './site/**/*.php']
  },

  js: {
    entry: './assets/js/main.js',
    watch: ['./assets/js/main.js', './site/patterns/**/*.js']
  }
};

function bundle(bundler) {
  return bundler
    .on('error', gutil.log)
    .transform("babelify", {presets: ["es2015"]})
    .bundle()
    .pipe(exorcist('./assets/js/dist/bundle.map.js'))
    .pipe(source(config.js.entry))
    .pipe(buffer())
    .pipe(plugins.rename('bundle.js'))
    .pipe(plugins.size({title: 'js bundle size'}))
    .pipe(gulp.dest('./assets/js/dist/'))
    .pipe(browserSync.stream())
  ;
}

gulp.task('js', function () {
  return bundle(browserify({
    entries: [
      config.js.entry,
      glob.sync('./site/patterns/**/*.js')
    ]
  }));
});

gulp.task('js:optimize', function() {
  return gulp.src('./assets/js/dist/bundle.js')
    .pipe(plugins.plumber())
    .pipe(plugins.uglify())
    .pipe(plugins.rename('bundle.min.js'))
    .pipe(plugins.size({title: 'js compiled size'}))
    .pipe(gulp.dest('./assets/js/dist/'))
  ;
});

gulp.task('js:disc', function() {
  // FIXME: currently does not work when using Vue :/
  return plugins.run('discify assets/js/dist/bundle.js --open > disc.html').exec();
});

gulp.task('scss', function () {
  return gulp.src(config.scss.entry)
    .pipe(plugins.plumber({
      errorHandler: function (err) {
        gutil.log(err.message);
        this.emit('end');
      }
    }))
    .pipe(plugins.sassGlob())
    .pipe(plugins.sourcemaps.init({loadMaps: true}))
    .pipe(plugins.sass({ importer }))
    .pipe(plugins.concat('bundle.css'))
    .pipe(plugins.size({ title: 'css compiled size' }))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest('./assets/css'))
    .pipe(browserSync.stream())
  ;
});

gulp.task('scss:optimize', function () {
  return gulp.src('./assets/css/bundle.css')
    .pipe(plugins.plumber())
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.minifyCss())
    .pipe(plugins.size({ title: 'css optimized size' }))
    .pipe(gulp.dest('./assets/css'))
  ;
});

gulp.task('default', ['watch']);

gulp.task('build', ['scss', 'js'], function() {
  gulp.start('js:optimize');
  gulp.start('scss:optimize');
});

gulp.task('watch', function () {
  browserSync.init({ proxy: config.host, open: false });

  watchify.args.debug = config.debug;
  console.log(watchify.args);
  var watcher = watchify(browserify({
    entries: [
      config.js.entry,
      glob.sync('./site/patterns/**/*.js')
    ]
  }, watchify.args));

  watcher.on('update', function(){bundle(watcher); });
  watcher.on('log', gutil.log);
  bundle(watcher); // call it once so the next ones are super fast

  gulp.watch('./assets/js/dist/bundle.js', ['js:optimize']);
  gulp.watch(config.scss.watch, ['scss']);
  gulp.watch(config.php.watch, browserSync.reload);
});
