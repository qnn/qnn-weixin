switch (process.env['NODE_ENV']) {
case 'test':
  exports.weixin   = { token: __dirname + '/token.test.json' };
  break;
default:
  exports.weixin   = { token: __dirname + '/token.json' };
}

exports.weixin.api = {
                       host: 'api.weixin.qq.com',
                       port: 443,
                       token: {
                         get: '/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s'
                       },
                       menu: {
                         create:  '/cgi-bin/menu/create?access_token=%s',
                         show:    '/cgi-bin/menu/get?access_token=%s',
                         destroy: '/cgi-bin/menu/delete?access_token=%s',
                       }
                     };

exports.lib        = {
                       coord:            __dirname + '/lib/libcoord',
                       store:            __dirname + '/lib/libstore',
                       weixin:           __dirname + '/lib/libweixin',
                       weixinapi:        __dirname + '/lib/libweixin.api',
                       weixin_templates: __dirname + '/lib/weixin.templates.yml'
                     };

exports.config     = __dirname + '/config.yml';

exports.test       = {
                       weixin_data: __dirname + '/test/test.weixin.data.yml'
                     };

exports.stores     = __dirname + '/stores.json';
