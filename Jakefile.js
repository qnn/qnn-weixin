task('default', function(){
  var jake = require('child_process').spawn('jake', ['-T']);
  jake.stdout.on('data', function(data){
    process.stdout.write(data.toString());
  });
});

desc('Find coordinates.');
task('coord', function(){

  function has_coordinates(store) {
    return /^(\-?\d+(\.\d+)?),\s*(\-?\d+(\.\d+)?)$/m.test(store.join('\n'));
  }

  function normalize_address(address) {
    return address.replace(/[\(（,，\/].*$/, '');
  }

  function find_coordinates_to_address(address) {
    if (address.length == 0) return;
    var http = require('http');
    http.get('http://api.map.baidu.com/?qt=s&rn=1&wd=' + address, function(res){
      var body = '';
      res.on('data', function (chunk) { body += chunk; });
      res.on('end', function(){
        body = JSON.parse(body);
        if (body.hasOwnProperty('content')) {
          console.log(body['content'][0]['geo']);
        } else {
          address = address.slice(0,-1)
          find_coordinates_to_address(address);
          console.log('Trying ' + address + '...');
        }
      });
    });
  }

  var stores_list = require('./stores.json');
  loop_p:
  for(var province in stores_list) {
    for(var city in stores_list[province]) {
      for(var i = 0; i < stores_list[province][city].length; i++) {
        var store = stores_list[province][city][i];
        if (!has_coordinates(store)) {
          var address = normalize_address(province + (province != city ? city : '') + store[1] + store[2]);
          find_coordinates_to_address(address);
          break loop_p;
        }
      }
    }
  }
});
