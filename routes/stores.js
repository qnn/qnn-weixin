exports.list_all = function(req, res){
  stores_list = require('../stores.json');
  res.render('stores', { stores: stores_list });
};
