var paths = require('../paths');
var weixin = require(paths.lib.weixin);

var verify = function(req, res){
  var verified = weixin.verify_signature(req.query);
  if (!verified) {
    res.writeHead(401);
    res.end();
    return false;
  }
  return true;
}

exports.get = function(req, res){
  if (!verify(req, res)) return;

  res.send(req.query.echostr);
};

exports.post = function(req, res){
  if (!verify(req, res)) return;

  // weixin's post data is just xml...
  var raw_post_data = '';
  req.on('data', function(data){ raw_post_data += data; });
  req.on('end', function(){
    var parseString = require('xml2js').parseString;
    parseString(raw_post_data, function (err, result) {
      if (!err) {
        var response = weixin.process(result);
        if (response) {
          if (response.substr(0, 5) == '<xml>') {
            res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
          }
          res.write(response);
        } else {
          res.writeHead(204);
        }
      }
      res.end();
    });
  });
};
