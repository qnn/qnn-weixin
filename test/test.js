process.env['NODE_ENV'] = 'test';

var app = require('../app');
var request = require('supertest');
var libweixin = require('../lib/weixin');

require('js-yaml');
var test = require('./test.yml');
var weixin = require('../lib/weixin.yml');
var config = require('../weixin.config.yml');

describe('when user subscribe weixin account', function(){
  it('should return a welcome message (aka "newly_subscribed")', function(done){
    var to = 'gh_f7527586bc92', from = 'NZf2QSoejkO52d6Ikj_s0wwojS7j';
    request(app)
      .post('/weixin')
      .set('Content-Type', 'text/xml')
      .query(test.post_query)
      .send(require('util').format(test.subscribe, to, from))
      .expect(200)
      .expect(libweixin.respond_with_text({
        FromUserName: from,
        ToUserName: to
      }, config.newly_subscribed))
      .end(function(err, res){
        if (err) throw err;
        done();
      });
  });
});
