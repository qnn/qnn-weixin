require('js-yaml');

var paths = require('../paths');
var weixin_templates = require(paths.lib.weixin_templates);
var config = require(paths.config);

var store = require(paths.lib.store);
// remove stores.json from module caches as its content was manipulated. it will be 're-required'.
delete require.cache[require.resolve('../stores.json')];
var stores_list = store.flatten(require('../stores.json'));

var format = require('util').format;
var get_time = function(){ return Math.floor(new Date().getTime() / 1000); };

exports.verify_signature = function(query) {
  var token = require(paths.weixin.token).token;
  var string = [token, query.timestamp, query.nonce].sort().join('');
  var shasum = require('crypto').createHash('sha1');
  string = shasum.update(string).digest('hex');
  return string === query.signature;
};

var respond_with_text = function(context, message) {
  return format(weixin_templates.text_response_template,
         context.FromUserName, context.ToUserName, get_time(), message);
};

var make_list_item = function(list_item) {
  return format.apply(this, [weixin_templates.list_item_template].concat(list_item));
};

var respond_with_list = function(context, list) {
  var count = list.length;
  var items = '';
  for (var i = 0; i < count; i++) {
    items += make_list_item(list[i]);
  }
  items = items.trim();
  return format(weixin_templates.list_response_template,
         context.FromUserName, context.ToUserName, get_time(),
         count, items);
};

var context_get_string = function(context, property) {
  return (context[property] instanceof Array) ? context[property].join('') : context[property];
};

exports.respond_with_text = respond_with_text;
exports.respond_with_list = respond_with_list;

exports.process = function(xml) {
  var context = xml.xml;

  var message_type = context_get_string(context, 'MsgType');
  var event        = context_get_string(context, 'Event');
  var content      = context_get_string(context, 'Content');

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
    var x = context_get_string(context, 'Location_X');
    var y = context_get_string(context, 'Location_Y');
    return respond_with_list(context,
           store.find_nearby_stores_to_weixin_list(stores_list, x, y));
  }
  return null;
};
