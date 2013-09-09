var paths = require('../paths');
var config = require(paths.config);

var assert = require('assert');

exports.flatten = function(stores_list) {
  var flattened_stores_list = [];
  for(var province in stores_list) {
    for(var city in stores_list[province]) {
      for(var i = 0; i < stores_list[province][city].length; i++) {
        var store = stores_list[province][city][i];
        store.splice(1, 0, city);
        store.splice(1, 0, province);
        flattened_stores_list.push(store);
      }
    }
  }
  return flattened_stores_list;
};

var find_nearby_stores = function(stores_list, latitude, longitude) {
  var coord = require('./coord');
  if (/^\-?([0-9]|[1-8][0-9]|90)\.[0-9]{1,6}$/.test(latitude)) {
    if (/^\-?([0-9]{1,2}|1[0-7][0-9]|180)\.[0-9]{1,6}$/.test(longitude)) {
      latitude = parseFloat(latitude);
      longitude = parseFloat(longitude);

      for(var i = 0; i < stores_list.length; i++) {
        var lat = stores_list[i][9];
        var lng = stores_list[i][10];
        var distance = coord.distance_between_coordinates(latitude, longitude, lat, lng);
        distance = +(distance).toFixed(3);

        // the distance will be 'continuously' appended to the end of array
        // under certain 'unknown' circumstances (e.g. in test.js)
        // to keep the same array length, remove the distance element at the end of array
        if (stores_list[i].length == 12) stores_list[i].pop();
        stores_list[i].push(distance);
      }

      stores_list.sort(function(a, b){
        return a[11] - b[11];
      });
      assert.strictEqual(stores_list[0].length, 12, 'module cache problem?'); // temporaily test
    }
  }
  return stores_list;
};

var baidu_maps_static_img_url = function(x, y) {
  var url = 'http://api.map.baidu.com/staticimage?width=640&height=320&center=%s&zoom=16&markers=%s&markerStyles=m';
  var coord = y + ',' + x;
  return require('util').format(url, coord, coord);
}

exports.find_nearby_stores = find_nearby_stores;
exports.find_nearby_stores_to_weixin_list = function(stores_list, latitude, longitude) {
  var list = find_nearby_stores(stores_list, latitude, longitude);

  var weixin_list = [];
  weixin_list.push([config.title_of_first_nearby_store, '', baidu_maps_static_img_url(list[0][9], list[0][10]), 'http://www.qnnsafe.com/']);

  for (var i = 0; i < Math.min(config.number_of_nearby_stores_to_list, list.length); i++) {
    var title = list[i][0] + '\n' + 
        '地址：' + list[i][1] + (list[i][1] != list[i][2] ? list[i][2] : '') + list[i][3] + list[i][4] + '\n' +
        '直线距离：' + list[i][11] + 'km';
    weixin_list.push([ title, '', config.default_nearby_store_image_url, 'http://www.qnnsafe.com/' ]);
  }
  return weixin_list;
};
