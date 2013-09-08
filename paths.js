switch (process.env['NODE_ENV']) {
case 'test':
  exports.weixin = { token: __dirname + '/weixin.token.test.json' };
  break;
default:
  exports.weixin = { token: __dirname + '/weixin.token.json' };
}
