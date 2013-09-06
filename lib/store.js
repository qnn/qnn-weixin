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
