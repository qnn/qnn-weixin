switch (process.env['NODE_ENV']) {
case 'test':
  exports.weixin = { token: __dirname + '/token.test.json' };
  break;
default:
  exports.weixin = { token: __dirname + '/token.json' };
}

exports.config = __dirname + '/config.yml';
