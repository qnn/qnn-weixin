module.exports = function(grunt) {

  var paths         = require('./paths');
  var libweixinapi  = require(paths.lib.weixinapi);

  grunt.registerTask('menu:show', 'Show current Weixin menu.', function() {
    var finish = this.async();
    libweixinapi.show_menu(function(response, remote_menu, local_menu) {
      grunt.log.writeln('>>> Local Menu <<<');
      grunt.log.writeln(local_menu);
      grunt.log.writeln('>>> Remote Menu <<<');
      if (remote_menu) {
        grunt.log.writeln(remote_menu);
      } else {
        grunt.log.errorlns('Failed: ' + response);
      }
      if (local_menu == remote_menu) {
        grunt.log.ok('Nothing to do! Local menu is the same as the remote one.');
      } else {
        grunt.log.ok('You can run jake menu:create to update remote menu.')
      }
      finish();
    });
  });

  grunt.registerTask('menu:update', 'Update current Weixin menu.', function() {
    var finish = this.async();
    libweixinapi.create_menu(function(response, request, error) {
      if (error.errcode == 0) {
        grunt.log.ok('Success: Menu was successfully modifed.');
      } else {
        grunt.log.errorlns('Failed: ' + error.errmsg);
        if (error.errcode == -1) {
          grunt.log.errorlns('System is busy. Please try again later.');
        }
        grunt.log.errorlns(request);
      }
      finish();
    });
  });

  grunt.registerTask('menu:destroy', 'Destroy current Weixin menu.', function() {
    var finish = this.async();
    libweixinapi.destroy_menu(function(response, error) {
      if (error.errcode == 0) {
        grunt.log.ok('Success: Menu was successfully destroyed.');
      } else {
        grunt.log.errorlns('Failed: ' + error.errmsg);
      }
    });
  });

  grunt.registerTask('token', 'Update token file.', function() {
    var finish = this.async();
    var rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    var keys = ['token', 'appid', 'appsecret'];
    var values = {};
    var index = 0;
    var ask = function(done){
      rl.question('Enter your weixin ' + keys[index] + ': ', function(value){
        values[keys[index]] = value;
        index++;
        if (index < keys.length) {
          ask(done);
        } else {
          done();
        }
      });
    }
    ask(function(){
      require('fs').writeFile(paths.weixin.token,
        JSON.stringify(values, null, 2) + '\n', function(error) {
          if (error) {
            grunt.log.errorlns('Error saving token to file: ' + paths.weixin.token + '.');
          } else {
            grunt.log.ok('Token was saved to file' + paths.weixin.token + '.');
          }
          rl.close();
          finish();
        }
      );
    });
  });

  grunt.registerTask('coord', 'Find coordinates.', function() {
    var finish = this.async();
    var stores_list = require(paths.stores);
    var coord = require(paths.lib.coord);

    function has_coordinates(store) {
      return /^\-?\d+\.\d+$/m.test(store.join('\n'));
    }

    function normalize_address(address) {
      return address.replace(/[\(（,，\/].*$/, '');
    }

    function save_stores_list(callback) {
      var json_string = JSON.stringify(stores_list, null, 2);
      json_string = json_string.replace(/\n\s{8}/g, '').replace(/\n\s{6}\]/g, ']') + '\n';
      require('fs').writeFile(paths.stores, json_string, function(err){
        if (err) grunt.log.errorlns('ERROR: ' + err);
        callback();
      })
    }

    function find_coordinates_to_address(address, __, callback) {
      if (address.length == 0) {
        callback();
        return;
      }
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
              grunt.log.errorlns('WARNING: No coords returned for address: ' + address);
            } else {
              stores_list[__[0]][__[1]][__[2]] = stores_list[__[0]][__[1]][__[2]].concat(coordinates);
              save_stores_list(callback);
            }
          } else {
            address = address.slice(0, -1);
            grunt.log.writeln('Trying ' + address + '...');
            find_coordinates_to_address(address, __, callback);
          }
        });
      });
    }

    var async = require('async');
    var concurrency = 3;
    var queue = async.queue(function(data, callback) {
      find_coordinates_to_address(data.address, [data.province, data.city, data.i], callback);
    }, concurrency);

    for(var province in stores_list) {
      for(var city in stores_list[province]) {
        for(var i = 0; i < stores_list[province][city].length; i++) {
          var store = stores_list[province][city][i];
          if (!has_coordinates(store)) {
            var address = normalize_address(province + (province != city ? city : '') + store[1] + store[2]);
            queue.push({ address: address, province: province, city: city, i: i });
          }
        }
      }
    }

    queue.drain = function() {
      grunt.log.ok('All items have been processed.');
      finish();
    };

    if (queue.length() === 0) {
      queue.drain();
    }
  });

};
