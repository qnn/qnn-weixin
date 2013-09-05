exports.index = function(req, res){
  stores_list = require('../stores.json');
  res.render('index', { stores: stores_list });
};
