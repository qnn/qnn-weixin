var weixin = require('../lib/weixin');

var verify = function(req, res){
  var verified = weixin.verify_signature(req.query);
  if (!verified) {
    res.writeHead(401);
    res.end();
  }
}

exports.get = function(req, res){
  verify(req, res);

  res.send(req.query.echostr);
};

exports.post = function(req, res){
  verify(req, res);

  // weixin's post data is just xml...
  var raw_post_data = '';
  req.on('data', function(data){ raw_post_data += data; });
  req.on('end', function(){
    console.log(raw_post_data);
    res.end();
  });
};
