exports.get = function(req, res){
  var weixin = require('../lib/weixin');
  var verified = weixin.verify_signature(req.query);
  if (verified) {
    res.send(req.query.echostr);
  } else {
    res.writeHead(401).end();
  }
};

exports.post = function(req, res){
  var verified = weixin.verify_signature(req.query);
  if (!verified) res.writeHead(401).end();

  // weixin's post data is just xml...
  var raw_post_data = '';
  req.on('data', function(data){ raw_post_data += data; });
  req.on('end', function(){
    console.log(raw_post_data);
    res.end();
  });
};
