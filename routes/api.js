exports.stores = function(req, res){  // sort by distance
  var latitude = req.query.lat;
  var longitude = req.query.lng;
  var count = req.query.count;
  var start = req.query.start;
  var callback = req.query.callback;

  var paths = require('../paths');
  var store = require(paths.lib.store);
  // remove stores.json from module caches as its content was manipulated. it will be 're-required'.
  delete require.cache[require.resolve(paths.stores)];
  var stores_list = store.flatten(require(paths.stores));

  if (count > 0) {
    count = parseInt(count);
  } else {
    count = 10;
  }

  if (start >= 0 && start < stores_list.length) {
    start = parseInt(start);
  } else {
    start = 0;
  }

  stores_list = store.find_nearby_stores(stores_list, latitude, longitude);

  var end = start + count;
  if (end > stores_list.length) end = stores_list.length;

  stores_list = stores_list.slice(start, end);

  var output = { stores: stores_list };

  if (callback) {
    res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
    res.write(callback + '(' + JSON.stringify(output, null, 0) + ');');
    res.end();
  } else {
    res.json(output);
  }
};
