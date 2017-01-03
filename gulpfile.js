var gulp = require('gulp');
var ts = require('gulp-typescript');

var sources = 'src/**/*.ts';

gulp.task('default', function () {
    return gulp.src(sources)
        .pipe(ts({
            noImplicitAny: true,
            target: 'ES5',
        }))
        .pipe(gulp.dest('build'));
});

gulp.task('watch', ['default'], function () {
    gulp.watch(sources, ['default']);
});