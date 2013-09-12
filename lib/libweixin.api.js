require('js-yaml');
var paths  = require('../paths');
var https  = require('https');
var format = require('util').format;
var token  = require(paths.weixin.token);
var config = require(paths.config);

var get_access_token = function(done) {
  var request = https.request({
    host: paths.weixin.api.host,
    port: paths.weixin.api.port,
    path: format(paths.weixin.api.token.get, token.appid, token.appsecret),
    method: 'GET'
  }, function(res){
    var body = '';
    res.on('data', function (chunk) { body += chunk; });
    res.on('end', function(){
      var a_t = JSON.parse(body);
      if (a_t.hasOwnProperty('access_token') && a_t.hasOwnProperty('expires_in')) {
        console.log('Success: Got access token.');
        done(a_t.access_token);
      } else {
        console.log('Failed to get access token:');
        console.log(body);
      }
    });
  });
  request.end();
};

var menu_json_to_yaml = function(menus) {
  var parse = function(object) {
    switch (object.type) {
    case 'view':  return ' ' + object.url;
    case 'click': return ' ' + object.key;
    }
    return '';
  };

  menus = menus.button;
  var yaml = 'menus:';
  for (var i = 0; i < menus.length; i++) {
    yaml += '\n  ' + menus[i]['name'] + ':';
    if (menus[i].hasOwnProperty('sub_button') &&
        menus[i]['sub_button'].length > 0) {
      var submenus = menus[i]['sub_button'];
      var submenus_count = 0;
      for (var j = 0; j < submenus.length; j++) {
        if (!submenus[j].hasOwnProperty('name')) continue;
        yaml += '\n    ' + submenus[j].name + ':';
        yaml += parse(submenus[j]);
        submenus_count++;
      }
      // remove parent if no child
      if (submenus_count == 0)
        yaml = yaml.substring(0, yaml.lastIndexOf("\n"));
    } else {
      yaml += parse(menus[i]);
    }
  }
  return yaml;
};

var menu_yaml_to_json = function(menus) {
  var parse = function(object, key) {
    if (/^https?:\/\//.test(object[key])) {
      return { type: 'view', name: key, url: object[key] };
    } else {
      return { type: 'click', name: key, key: object[key] };
    }
  };

  var json = { button: [] };
  for (var menu in menus) {
    var button = {};
    if (menus[menu] instanceof Object) {
      button['name'] = menu;
      button['sub_button'] = [];
      for (var submenu in menus[menu]) {
        button['sub_button'].push(parse(menus[menu], submenu));
      }
    } else {
      button = parse(menus, menu);
      button['sub_button'] = [];
    }
    json.button.push(button);
  }
  return json;
};

exports.show_menu = function(done) {
  get_access_token(function(access_token){
    var request = https.request({
      host: paths.weixin.api.host,
      port: paths.weixin.api.port,
      path: format(paths.weixin.api.menu.show, access_token),
      method: 'GET'
    }, function(res){
      var body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function(){
        var json = JSON.parse(body);
        var remote = null;
        if (json.hasOwnProperty('menu')) {
          remote = menu_json_to_yaml(json.menu);
        }
        var local = menu_json_to_yaml(menu_yaml_to_json(config.menus));
        done(body, remote, local);
      });
    });
    request.end();
  });
};

exports.create_menu = function(done) {
  var menu_string = JSON.stringify(menu_yaml_to_json(config.menus), null, 0);
  var menu_buffer = new Buffer(menu_string, 'utf8');
  get_access_token(function(access_token){
    var request = https.request({
      host: paths.weixin.api.host,
      port: paths.weixin.api.port,
      path: format(paths.weixin.api.menu.create, access_token),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': menu_buffer.length
      }
    }, function(res){
      var body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function(){
        var err = JSON.parse(body);
        done(body, menu_string, err);
      });
    });
    request.write(menu_buffer);
    request.end();
  });
};

exports.destroy_menu = function(done) {
  get_access_token(function(access_token){
    var request = https.request({
      host: paths.weixin.api.host,
      port: paths.weixin.api.port,
      path: format(paths.weixin.api.menu.destroy, access_token),
      method: 'GET'
    }, function(res){
      var body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function(){
        var err = JSON.parse(body);
        done(body, err);
      });
    });
    request.end();
  });
};
