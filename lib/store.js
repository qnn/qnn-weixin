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
        stores_list[i].push(distance);
      }

      stores_list.sort(function(a, b){
        return a[11] - b[11];
      });
    }
  }
  return stores_list;
};

exports.find_nearby_stores = find_nearby_stores;
exports.find_nearby_stores_to_weixin_list = function(stores_list, latitude, longitude) {
  var list = find_nearby_stores(stores_list, latitude, longitude);
  var weixin_list = [];
  var image_url = 'http://www.qnnsafe.com/assets/images/qnn-icon-152.png';
  for (var i = 0; i < Math.min(5, list.length); i++) {
    var info = '地址：' + list[i][1] + (list[i][1] != list[i][2] ? list[i][2] : '') + list[i][3] + list[i][4];
    weixin_list.push([ list[i][0], info, image_url, 'http://www.qnnsafe.com/' ]);
  }
  return weixin_list;
};
