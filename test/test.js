process.env['NODE_ENV'] = 'test';

var app = require('../app');
var request = require('supertest');
var libweixin = require('../lib/weixin');

var format = require('util').format;

require('js-yaml');
var test = require('./test.yml');
var weixin = require('../lib/weixin.yml');
var config = require('../weixin.config.yml');

var to = 'gh_f7527586bc92', from = 'NZf2QSoejkO52d6Ikj_s0wwojS7j';

var make_request = function() {
  return request(app).post('/weixin').set('Content-Type', 'text/xml').query(test.post_query);
};

describe('subscription functionality', function(){
  describe('when user subscribe weixin account', function(){
    it('should return a welcome message (aka "newly_subscribed")', function(done){
      make_request()
        .send(format(test.subscribe, to, from))
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

  describe('when user unsubscribe weixin account', function(){
    it('should return 204', function(done){
      make_request()
        .send(format(test.unsubscribe, to, from))
        .expect(204)
        .end(function(err, res){
          if (err) throw err;
          done();
        });
    });
  });
});

describe('find nearby stores with position/coordinates functionality', function(){
  describe('when user sends his/her coordinates', function(){
    it('should return a list of nearby stores', function(done){
      var x = 23.134521, y = 113.358803;

      var store = require('../lib/store');
      // remove stores.json from module caches as its content was manipulated. it will be 're-required'.
      delete require.cache[require.resolve('../stores.json')];
      var stores_list = store.flatten(require('../stores.json'));
      var list = store.find_nearby_stores_to_weixin_list(stores_list, x, y);

      make_request()
        .send(format(test.find_nearby_stores, to, from, x, y))
        .expect(200)
        .expect(libweixin.respond_with_list({
          FromUserName: from,
          ToUserName: to
        }, list))
        .end(function(err, res){
          if (err) throw err;
          done();
        });
    });
  });
});
