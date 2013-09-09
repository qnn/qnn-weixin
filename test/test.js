process.env['NODE_ENV'] = 'test';

var app = require('../app');
var request = require('supertest');
var libweixin = require('../lib/weixin');

var format = require('util').format;
var assert = require('assert');
var parseString = require('xml2js').parseString;

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
  var x = 22.849068, y = 113.216673;

  var store = require('../lib/store');
  // remove stores.json from module caches as its content was manipulated. it will be 're-required'.
  delete require.cache[require.resolve('../stores.json')];
  var stores_list = store.flatten(require('../stores.json'));
  var list = store.find_nearby_stores_to_weixin_list(stores_list, x, y);

  var validate_content = function(content, done) {
    parseString(content, function (err, result) {
      if (err) throw err;
      assert(result.hasOwnProperty('xml'), 'not xml?');
      assert(result.xml.hasOwnProperty('Articles'), 'no articles?');
      assert((result.xml.Articles instanceof Array), 'no articles?');
      assert(result.xml.Articles[0].hasOwnProperty('item'), 'article has no items?');
      assert((result.xml.Articles[0].item instanceof Array), 'article item is not an array?');
      assert(result.xml.Articles[0].item[0].hasOwnProperty('Title'), 'article item not containing title?');
      assert(result.xml.Articles[0].item[0].hasOwnProperty('Description'), 'article item not containing description?');
      assert(result.xml.Articles[0].item[0].hasOwnProperty('PicUrl'), 'article item not containing pic_url?');
      assert(result.xml.Articles[0].item[0].hasOwnProperty('Url'), 'article item not containing url?');
      assert.strictEqual(result.xml.Articles[0].item.length, 6, 'wrong number of stores?');
      assert((result.xml.Articles[0].item[0].Title instanceof Array), 'article item title is not an array?');
      assert.strictEqual(result.xml.Articles[0].item[0].Title.join(''), '打开地图查看各销售网点位置', 'wrong calculation?');
      assert.strictEqual(result.xml.Articles[0].item[1].Title.join('').split('\n')[0], '佛山大良专卖店', 'wrong calculation?');
      done();
    });
  }

  describe('when user sends his/her coordinates', function(){
    it('should return a list of nearby stores', function(done){
      make_request()
        .send(format(test.find_nearby_stores, to, from, x, y))
        .expect(200)
        .expect(libweixin.respond_with_list({
          FromUserName: from,
          ToUserName: to
        }, list))
        .end(function(err, res){
          if (err) throw err;
          validate_content(res.text, done);
        });
    });
  });

  describe('when user send coordinates text', function(){
    it('should return a list of stores near that point', function(done){
      make_request()
        .send(format(test.text, to, from, x + ', ' + y))
        .expect(200)
        .expect(libweixin.respond_with_list({
          FromUserName: from,
          ToUserName: to
        }, list))
        .end(function(err, res){
          if (err) throw err;
          validate_content(res.text, done);
        });
    });
  });
});
