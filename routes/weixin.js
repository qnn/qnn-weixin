exports.get = function(req, res){
  var weixin = require('../lib/weixin');
  var verified = weixin.verify_signature(req.query);
  if (verified) {
    res.send(req.query.echostr);
  } else {
    res.writeHead(302, { 'Location': '/' });
    res.end();
  }
};

exports.post = function(req, res){
  console.log(req.query, req.body);
  res.end();
};
