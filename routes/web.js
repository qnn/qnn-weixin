var paths = require('../paths');

exports.index = function(req, res) {
  res.render('index');
};

// Note:
// The 'lat' and 'lng' parameter should always be the user's latitude and longitude
// Do not mess up this coordinates with the ones of any store.

var validate_coordinates = function(params, prefix) {
  prefix = prefix || '';
  var valid = {};
  if (!/^\-?([0-9]|[1-8][0-9]|90)\.[0-9]{1,6}$/.test(params[prefix + 'lat']) ||
      !/^\-?([0-9]{1,2}|1[0-7][0-9]|180)\.[0-9]{1,6}$/.test(params[prefix + 'lng'])) {
    valid[prefix + 'lat'] = '';
    valid[prefix + 'lng'] = '';
    return valid;
  }
  valid[prefix + 'lat'] = params[prefix + 'lat'];
  valid[prefix + 'lng'] = params[prefix + 'lng'];
  return valid;
}

exports.stores = function(req, res, next) {
  var store_name = req.params.store;
  if (store_name) {
    var coord = validate_coordinates(req.query);
    var store = require(paths.lib.store);
    // remove stores.json from module caches as its content was manipulated. it will be 're-required'.
    delete require.cache[require.resolve(paths.stores)];
    var stores_list = store.flatten(require(paths.stores));
    var stores = store.find_stores(stores_list, store_name);
    if (stores.length == 0) {
      next(); // try next route to maybe a 404 page
    } else {
      res.render('store_details', { stores: stores, lat: coord.lat, lng: coord.lng });
    }
  } else {
    res.render('stores');
  }
};

// mobile:
exports.maps = function(req, res) {
  var coord = validate_coordinates(req.query);
  var tocoord = validate_coordinates(req.query, 'to');
  res.render('maps', {
      lat: coord.lat,         lng: coord.lng,
    tolat: tocoord.tolat,   tolng: tocoord.tolng,
    count: 30
  });
};
