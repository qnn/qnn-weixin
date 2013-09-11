var paths         = require('./paths');
var child_process = require('child_process');
var STDOUT        = {
                      write: function(data){
                        process.stdout.write(data.toString());
                      }
                    };

var https         = require('https');
var format        = require('util').format;
var token         = require(paths.weixin.token);

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

/*
 * Menu
 */

var get_access_token = function(done) {
  https.get(format(paths.weixin.api.token.get, token.appid, token.appsecret), function(res){
    var body = '';
    res.on('data', function (chunk) { body += chunk; });
    res.on('end', function(){
      var a_t = JSON.parse(body);
      if (a_t.hasOwnProperty('access_token') && a_t.hasOwnProperty('expires_in')) {
        done(a_t.access_token);
      } else {
        console.log('Failed to get access token:');
        console.log(body);
      }
    });
  });
};

var menu_json_to_yaml = function(json) {
  var menus = json.menu.button;
  var yaml = 'menus:';
  for (var i = 0; i < menus.length; i++) {
    yaml += '\n  ' + menus[i]['name'] + ':';
    var submenus = menus[i]['sub_button'];
    var submenus_count = 0;
    for (var j = 0; j < submenus.length; j++) {
      if (!submenus[j].hasOwnProperty('name')) continue;
      yaml += '\n    ' + submenus[j].name + ': ';
      if (submenus[j].type == 'view') {
        yaml += submenus[j].url;
      }
      submenus_count++;
    }
    // remove parent if no child
    if (submenus_count == 0) yaml = yaml.substring(0, yaml.lastIndexOf("\n"));
  }
  return yaml;
};

namespace('menu', function(){
  desc('show current menu');
  task('show', function(){
    get_access_token(function(access_token){
      https.get(format(paths.weixin.api.menu.show, access_token), function(res){
        var body = '';
        res.on('data', function (chunk) { body += chunk; });
        res.on('end', function(){
          console.log('Menu in YAML:\n' + menu_json_to_yaml(JSON.parse(body)));
        });
      });
    });
  });
});

/*
 * Token
 */

desc('create or update token file');
task('token', function(){
  var rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter your Weixin token: ', function(token){
    if (token.length < 3 || token.length > 32) {
      console.log('What you type does not look like a token. Aborted.');
      rl.close();
      return;
    }
    require('fs').writeFile(paths.weixin.token, JSON.stringify({
      token: token
    }, null, 2) + '\n', function(error){
      console.log( (error ? 'Error saving token to file' :
                            'Token was saved to file') + ': ' + paths.weixin.token + '.');
      rl.close();
    });
  });
});

/*
 * Coordinates
 */

desc('find coordinates');
task('coord', function(){
  var stores_list = require(paths.stores);
  var coord = require(paths.lib.coord);

  function has_coordinates(store) {
    return /^\-?\d+\.\d+$/m.test(store.join('\n'));
  }

  function normalize_address(address) {
    return address.replace(/[\(（,，\/].*$/, '');
  }

  function save_stores_list() {
    var json_string = JSON.stringify(stores_list, null, 2);
    json_string = json_string.replace(/\n\s{8}/g, '').replace(/\n\s{6}\]/g, ']') + '\n';
    require('fs').writeFile(paths.stores, json_string, function(err){
      if (err) console.log('ERROR: ' + err);
    })
  }

  function find_coordinates_to_address(address, __) {
    if (address.length == 0) return;
    var http = require('http');
    http.get('http://api.map.baidu.com/?qt=s&rn=1&wd=' + address, function(res){
      var body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function(){
        body = JSON.parse(body);
        if (body.hasOwnProperty('content')) {
          var coordinates;
          if (body['content'] instanceof Array) {
            coordinates = coord.parse_geostring(body['content'][0]['geo']);
          } else {
            coordinates = coord.parse_geostring(body['content']['geo']);
          }
          if (coordinates == null) {
            console.log('WARNING: No coords returned for address: ' + address);
          } else {
            stores_list[__[0]][__[1]][__[2]] = stores_list[__[0]][__[1]][__[2]].concat(coordinates);
            save_stores_list();
          }
        } else {
          address = address.slice(0,-1)
          find_coordinates_to_address(address, __);
          console.log('Trying ' + address + '...');
        }
      });
    });
  }

  loop_p:
  for(var province in stores_list) {
    for(var city in stores_list[province]) {
      for(var i = 0; i < stores_list[province][city].length; i++) {
        var store = stores_list[province][city][i];
        if (!has_coordinates(store)) {
          var address = normalize_address(province + (province != city ? city : '') + store[1] + store[2]);
          find_coordinates_to_address(address, [province, city, i]);
          //break loop_p; //if you want to try one
        }
      }
    }
  }

});
