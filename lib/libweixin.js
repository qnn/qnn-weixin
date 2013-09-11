require('js-yaml');

var paths = require('../paths');
var weixin_templates = require(paths.lib.weixin_templates);
var config = require(paths.config);

var store = require(paths.lib.store);
// remove stores.json from module caches as its content was manipulated. it will be 're-required'.
delete require.cache[require.resolve(paths.stores)];
var stores_list = store.flatten(require(paths.stores));

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

var prepend_url = function(string) {
  if (!/^https?:\/\//.test(string)) return config.base_url + string;
  return string;
};

var respond_with_sound = function(context, sound) {
  var title, desc, lqsound, hqsound;
  if (sound instanceof Array) {
    title = desc = lqsound = hqsound = prepend_url(sound[0]);
    switch (true) {
    case sound.length > 3:
      desc = sound[3];
    case sound.length > 2:
      title = sound[2];
    case sound.length > 1:
      hqsound = prepend_url(sound[1]);
    }
  } else {
    title = desc = lqsound = hqsound = prepend_url(sound);
  }
  return format(weixin_templates.sound_response_template,
         context.FromUserName, context.ToUserName, get_time(),
         title, desc, lqsound, hqsound);
};

exports.respond_with_text  = respond_with_text;
exports.respond_with_list  = respond_with_list;
exports.respond_with_sound = respond_with_sound;

exports.process = function(xml) {
  if (!xml || !xml.hasOwnProperty('xml')) return null;

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

    var text_as_coords = (new RegExp("^(\\-?([0-9]|[1-8][0-9]|90)\\.[0-9]{1,6}),\\s?" +
                         "(\\-?([0-9]{1,2}|1[0-7][0-9]|180)\\.[0-9]{1,6})$")).exec(content);
    if (text_as_coords) {
      return respond_with_list(context,
             store.find_nearby_stores_to_weixin_list(stores_list,
             text_as_coords[1], text_as_coords[3]));
    }

    if (!config.robots || !(config.robots instanceof Array)) return null;
    for (var i = 0; i < config.robots.length; i++) {
      var robot = config.robots[i];
      if (robot.regex) {
        var regex;
        if (robot.regex instanceof Array) {
          regex = new RegExp(robot.regex[0], robot.regex[1]);
        } else {
          regex = new RegExp(robot.regex);
        }

        var match = regex.exec(content);
        if (!match) continue;

        if (robot.sound) {
          return respond_with_sound(context, robot.sound);
        } else {
          return null;
        }
      }
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
