require('js-yaml');

var paths         = require('./paths');
var child_process = require('child_process');
var STDOUT        = {
                      write: function(data){
                        process.stdout.write(data.toString());
                      }
                    };

task('default', function(){
  var jake = child_process.spawn('jake', ['-T']);
  jake.stdout.on('data', STDOUT.write);
});

/*
 * Forever
 * 
 * accepts arguments: jake list\['--plain'\]
 */

var FOREVER = function(script, arguments){
  var args = [];
  for (argument in arguments) args.push(arguments[argument]);

  child_process.exec('which forever', function(error, stdout, stderr){
    if (!error && stdout) {
      process.env['NODE_ENV'] = 'production'; // production mode
      script(stdout.trim(), args);
    } else {
      console.log('Please install forever first: npm -g install forever');
    }
  });
}

var PID_FILE = __dirname + '/tmp/pids/forever.pid';

var START = function(verb, arguments){
  FOREVER(function(forever_path, arguments){
    var forever = child_process.spawn(forever_path, [
      verb,
      '-m', 5,
      '--append',
      '--minUptime', 2000,
      '--spinSleepTime', 1000,
      '-l', __dirname + '/log/forever.log',
      '-o', __dirname + '/log/forever.stdout.log',
      '-e', __dirname + '/log/forever.stderr.log',
      '--pidFile', PID_FILE,
      'app.js'
    ].concat(arguments));
    forever.stdout.on('data', STDOUT.write);
    forever.stderr.on('data', STDOUT.write);
  }, arguments);
};

desc('forever start');
task('start', function(){
  var args = arguments;
  require('fs').exists(PID_FILE, function(exists){
    if (exists) {
      console.log('Please use "jake stop" to stop current script first.');
      console.log('If problem still exists, manually remove the PID file:');
      console.log('> rm -f ' + PID_FILE);
    } else {
      START('start', args);
    }
  });
});

desc('forever restart');
task('restart', function(){
  var args = arguments;
  require('fs').exists(PID_FILE, function(exists){
    if (exists) {
      START('restart', args);
    } else {
      START('start', args);
    }
  });
});

desc('forever stop');
task('stop', function(){
  FOREVER(function(forever_path, arguments){
    var forever = child_process.spawn(forever_path, [
      'stop',
      '--pidFile', PID_FILE,
      'app.js'
    ].concat(arguments));
    forever.stdout.on('data', STDOUT.write);
    forever.stderr.on('data', STDOUT.write);
  }, arguments);
});

desc('forever list');
task('list', function(){
  FOREVER(function(forever_path, arguments){
    var forever = child_process.spawn(forever_path, [ 'list' ].concat(arguments));
    forever.stdout.on('data', STDOUT.write);
    forever.stderr.on('data', STDOUT.write);
  }, arguments);
});
