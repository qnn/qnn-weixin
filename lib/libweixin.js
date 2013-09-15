require('js-yaml');

var paths            = require('../paths');
var weixin_templates = require(paths.lib.weixin_templates);
var config           = require(paths.config);

var store            = require(paths.lib.store);

// remove stores.json from module caches as its content was manipulated. it will be 're-required'.
delete require.cache[require.resolve(paths.stores)];
var stores_list      = store.flatten(require(paths.stores));

var format           = require('util').format;

var get_time = function(){
  return Math.floor(new Date().getTime() / 1000);
};

var context_get_string = function(context, property) {
  return (context[property] instanceof Array) ? context[property].join('') : context[property];
};

var format_message = function(message){
  return message.replace(/([^\\])\\n/g, '$1\n').replace(/\\\\n/g, '\\n').replace(/\n/g, '\r\n');
};

exports.format_message = format_message;

var __prepend_url__ = function(base, string) {
  return /^https?:\/\//.test(string) ? string : (base + string);
};

var prepend_url = function(string) {
  return __prepend_url__(config.base_url, string);
};

var lists_web_path = function(key, entry, prepend_base_url) {
  var uri = '/lists/' + encodeURI(key) + (entry ? '/' + encodeURI(entry) : '');
  return prepend_base_url ? prepend_url(uri) : uri;
};

var get_excerpt = function (article) {
  return article.replace(/\r?\n([^]*?)$/, ' ...');
};

var make_list_item = function(list_item) {
  return format(weixin_templates.list_item_template,
    format_message(list_item[0] || ''), format_message(list_item[1] || ''),
    list_item[2] || '', list_item[3] || '');
};

var make_regex = function(stringORarray) {
  if (stringORarray instanceof Array) {
    return new RegExp(stringORarray[0], stringORarray[1]);
  } else {
    return new RegExp(stringORarray);
  }
};

// `entry` is a child of lists[key]
// `limit` (default is TRUE):
// list items shown on weixin should not more than 10
// `prepend_base_url` (default is TRUE):
// weixin's response must contain base_url
// make it false for web pages on current app server
var make_robot_list = function(key, entry, limit, prepend_base_url) {
  prepend_base_url = prepend_base_url === false ? false : true;
  limit = limit === false ? false : true;

  if (config.lists && config.lists.hasOwnProperty(key)) {

    var list       = config.lists[key];
    if (list.hasOwnProperty('require')) {
      var datakey = list.datakey;
      list = require(paths.app_path + list.require);
      if (datakey) list = list[datakey];
    }

    var link_base  = list.link_base_url || '',
        image_base = list.image_base_url || '',
        items      = list.items,
        for_length = limit ? Math.min(9, items.length) : items.length;
        output     = [];

    for (var i = 0; i < for_length; i++) {
      var title = items[i].title || '',
          image = items[i].image || '',
          links = items[i].links || '',
          words = '';

      if (entry) {
        if (items[i].title != entry) continue;
        words = items[i].words;
      } else {
        if (for_length == 1) {
          words = get_excerpt(items[i].words);
        }
      }

      if (image.length > 0) image = __prepend_url__(image_base, image);
      if (links.length > 0) {
        links = __prepend_url__(link_base, links);
      } else {
        links = lists_web_path(key, title, prepend_base_url);
      }
      output.push([title, words, image, links]);
    }
    if (limit && items.length > 9) {
      output.push([config.list_item_last, '', '', 
                  lists_web_path(key, null, prepend_base_url)]);
    }
    if (output.length == 0) output = null;
    return output;
  }
  return null;
};

exports.make_robot_list = make_robot_list;

exports.verify_signature = function(query) {
  var token = require(paths.weixin.token).token;
  var string = [token, query.timestamp, query.nonce].sort().join('');
  var shasum = require('crypto').createHash('sha1');
  string = shasum.update(string).digest('hex');
  return string === query.signature;
};

var respond_with_text = function(context, message) {
  return format(weixin_templates.text_response_template,
         context.FromUserName, context.ToUserName, get_time(), format_message(message));
};

var respond_with_list = function(context, list) {
  var count = list ? list.length : 0;
  var items = '';
  for (var i = 0; i < count; i++) {
    items += make_list_item(list[i]);
  }
  items = items.trim();
  return format(weixin_templates.list_response_template,
         context.FromUserName, context.ToUserName, get_time(),
         count, items);
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

var respond = function(context, robot) {
  if (robot.words) {
    return respond_with_text(context, robot.words);
  } else if (robot.sound) {
    return respond_with_sound(context, robot.sound);
  } else if (robot.lists) {
    return respond_with_list(context, make_robot_list(robot.lists))
  } else {
    return null;
  }
};

exports.process = function(xml) {
  if (!xml || !xml.hasOwnProperty('xml')) return null;

  var context      = xml.xml;
  var message_type = context_get_string(context, 'MsgType');
  var event        = context_get_string(context, 'Event');
  var event_key    = context_get_string(context, 'EventKey')
  var content      = context_get_string(context, 'Content');

  switch (message_type) {
  case 'event':

    switch (event) {
    case 'subscribe':
      return respond_with_text(context, config.newly_subscribed);
    case 'unsubscribe':
      return null; // when users unsubscribe, you cannot send them any message.
    case 'CLICK':
      for (var i = 0; i < config.robots.length; i++) {
        var robot = config.robots[i];
        if (robot.click == event_key ||
          ((robot.click instanceof Array) &&
            robot.click.indexOf(event_key) > -1)) {
          return respond(context, robot);
        }
      }
      return null;
    }
    break;

  case 'text':
    content = content.trim();

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
        var match = make_regex(robot.regex).exec(content);
        if (match) return respond(context, robot);
      } else if (robot.exact) {
        if (content == robot.exact) return respond(context, robot);
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
