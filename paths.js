switch (process.env['NODE_ENV']) {
case 'test':
  exports.weixin = { token: __dirname + '/token.test.json' };
  break;
default:
  exports.weixin = { token: __dirname + '/token.json' };
}

exports.lib      = {
                     coord:            __dirname + '/lib/libcoord',
                     store:            __dirname + '/lib/libstore',
                     weixin:           __dirname + '/lib/libweixin',
                     weixin_templates: __dirname + '/lib/weixin.templates.yml'
                   };

exports.config   = __dirname + '/config.yml';

exports.test     = {
                     weixin_data: __dirname + '/test/test.weixin.data.yml'
                   };

exports.stores   = __dirname + '/stores.json';

var prefix = 'https://api.weixin.qq.com/cgi-bin';

exports.weixin['api'] = {
                          token: {
                            get:    prefix + '/token?grant_type=client_credential&appid=%s&secret=%s'
                          },
                          menu: {
                            create: prefix + '/menu/create?access_token=%s',
                            show:   prefix + '/menu/get?access_token=%s',
                            destoy: prefix + '/menu/delete?access_token=%s'
                          }
                        };
