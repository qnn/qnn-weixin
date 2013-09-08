require('js-yaml');

var weixin = require('./weixin.yml');
var config = require('../weixin.config.yml');
var paths = require('../paths');

exports.verify_signature = function(query) {
  var token = require(paths.weixin.token).token;
  var string = [token, query.timestamp, query.nonce].sort().join('');
  var shasum = require('crypto').createHash('sha1');
  string = shasum.update(string).digest('hex');
  return string === query.signature;
};

var respond_with_text = function(context, message) {
  time = Math.round(new Date().getTime() / 1000);
  return require('util').format(weixin.text_response_template,
         context.FromUserName, context.ToUserName, time, message);
}

exports.respond_with_text = respond_with_text;

exports.process = function(xml) {
  var context = xml.xml;

  var message_type = context.MsgType;
  if (message_type instanceof Array) message_type = message_type.join('');

  var event = context.Event;
  if (event instanceof Array) event = event.join('');

  switch (message_type) {
  case 'event':
    switch (event) {
    case 'subscribe':
      return respond_with_text(context, config.newly_subscribed);
    case 'unsubscribe':
      return null; // when users unsubscribe, you cannot send them any message.
    }
    break;
  }
  return null;
};
