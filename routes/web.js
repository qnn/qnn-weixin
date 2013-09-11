var paths = require('../paths');

exports.index = function(req, res) {
  res.render('index');
};

exports.stores = function(req, res, next) {
  var store_name = req.params.store;
  if (store_name) {
    var store = require(paths.lib.store);
    // remove stores.json from module caches as its content was manipulated. it will be 're-required'.
    delete require.cache[require.resolve('../stores.json')];
    var stores_list = store.flatten(require('../stores.json'));
    var stores = store.find_stores(stores_list, store_name);
    if (stores.length == 0) {
      next(); // try next route to maybe a 404 page
    } else {
      res.render('store_details', { stores: stores });
    }
  } else {
    res.render('stores');
  }
};

// mobile:
exports.maps = function(req, res) {
  var lat = req.query.lat;
  var lng = req.query.lng;
  if (!/^\-?([0-9]|[1-8][0-9]|90)\.[0-9]{1,6}$/.test(lat) || !/^\-?([0-9]{1,2}|1[0-7][0-9]|180)\.[0-9]{1,6}$/.test(lng)) {
    lat = '';
    lng = '';
  }
  res.render('maps', { lat: lat, lng: lng, count: 30 });
};
