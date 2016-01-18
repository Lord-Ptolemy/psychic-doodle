/**
 * Created by Lukas on 18.01.2016.
 */
// get the dependencies
var gulp        = require('gulp'),
    childProcess  = require('child_process'),
    electron      = require('electron-prebuilt');


// create the gulp task
gulp.task('run', function () {
     childProcess.spawn(electron, ['--debug=5858','./angular/build/app'], { stdio: 'inherit' });
});