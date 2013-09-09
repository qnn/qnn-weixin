switch (process.env['NODE_ENV']) {
case 'test':
  exports.weixin = { token: __dirname + '/token.test.json' };
  break;
default:
  exports.weixin = { token: __dirname + '/token.json' };
}

exports.lib = {
  coord:            __dirname + '/lib/libcoord',
  store:            __dirname + '/lib/libstore',
  weixin:           __dirname + '/lib/libweixin',
  weixin_templates: __dirname + '/lib/weixin.templates.yml'
};

exports.config = __dirname + '/config.yml';

exports.test = {
  weixin_data: __dirname + '/test/test.weixin.data.yml'
}
