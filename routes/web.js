exports.index = function(req, res) {
  res.render('index');
};

exports.stores = function(req, res) {
  res.render('stores');
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
