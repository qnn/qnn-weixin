require('js-yaml');

var weixin = require('./weixin.yml');
var config = require('../weixin.config.yml');
var paths = require('../paths');

var store = require('./store');
// remove stores.json from module caches as its content was manipulated. it will be 're-required'.
delete require.cache[require.resolve('../stores.json')];
var stores_list = store.flatten(require('../stores.json'));

var format = require('util').format;
var get_time = function(){ return Math.round(new Date().getTime() / 1000); };

exports.verify_signature = function(query) {
  var token = require(paths.weixin.token).token;
  var string = [token, query.timestamp, query.nonce].sort().join('');
  var shasum = require('crypto').createHash('sha1');
  string = shasum.update(string).digest('hex');
  return string === query.signature;
};

var respond_with_text = function(context, message) {
  return format(weixin.text_response_template,
         context.FromUserName, context.ToUserName, get_time(), message);
};

var make_list_item = function(list_item) {
  return format.apply(this, [weixin.list_item_template].concat(list_item));
};

var respond_with_list = function(context, list) {
  var count = list.length;
  var items = '';
  for (var i = 0; i < count; i++) {
    items += make_list_item(list[i]);
  }
  items = items.trim();
  return format(weixin.list_response_template,
         context.FromUserName, context.ToUserName, get_time(),
         count, items);
};

exports.respond_with_text = respond_with_text;
exports.respond_with_list = respond_with_list;

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
  case 'location':
    return respond_with_list(context, 
           store.find_nearby_stores_to_weixin_list(stores_list,
           context.Location_X, context.Location_Y));
  }
  return null;
};
