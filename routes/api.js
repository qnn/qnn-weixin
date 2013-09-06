exports.stores = function(req, res){  // sort by distance
  var latitude = req.query.lat;
  var longitude = req.query.lng;
  var count = req.query.count;
  var start = req.query.start;

  var store = require('../lib/store');
  delete require.cache[require.resolve('../stores.json')];
  var stores_list = store.flatten(require('../stores.json'));
  var coord = require('../lib/coord');

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

  if (count <= stores_list.length && count > 0) {
    count = parseInt(count);
  } else {
    count = 10;
  }

  if (start >= 0 && start < stores_list.length) {
    start = parseInt(start);
  } else {
    start = 0;
  }

  res.json({ stores: stores_list.slice(start, start + count) });
};
