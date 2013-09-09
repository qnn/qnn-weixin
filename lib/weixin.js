require('js-yaml');

var paths = require('../paths');
var weixin = require('./weixin.yml');
var config = require(paths.config);

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

  var content = context.Content;
  if (content instanceof Array) content = content.join('');

  switch (message_type) {
  case 'event':
    switch (event) {
    case 'subscribe':
      return respond_with_text(context, config.newly_subscribed);
    case 'unsubscribe':
      return null; // when users unsubscribe, you cannot send them any message.
    }
    break;
  case 'text':
    var text_as_coords = /^(\-?([0-9]|[1-8][0-9]|90)\.[0-9]{1,6}),\s?(\-?([0-9]{1,2}|1[0-7][0-9]|180)\.[0-9]{1,6})$/.exec(content);
    if (text_as_coords) {
      return respond_with_list(context,
             store.find_nearby_stores_to_weixin_list(stores_list,
             text_as_coords[1], text_as_coords[3]));
    }
    break;
  case 'location':
    var x = context.Location_X;
    if (x instanceof Array) x = x.join('');

    var y = context.Location_Y;
    if (y instanceof Array) y = y.join('');

    return respond_with_list(context,
           store.find_nearby_stores_to_weixin_list(stores_list, x, y));
  }
  return null;
};
