process.env['NODE_ENV'] = 'test';

require('js-yaml');

var paths       = require('../paths');

var app         = require('../app');
var request     = require('supertest');
var weixin      = require(paths.lib.weixin);

var format      = require('util').format;
var assert      = require('assert');
var parseString = require('xml2js').parseString;

var weixin_data = require(paths.test.weixin_data);
var config      = require(paths.config);

var to          = 'gh_f7527586bc92',
    from        = 'NZf2QSoejkO52d6Ikj_s0wwojS7j',
    context     = { FromUserName: from, ToUserName: to };

describe('authentication functionality', function(){
  describe('for get requests', function(){
    it('should return 200', function(done){
      var echostr = '5922283080490844799';
      var query = JSON.parse(JSON.stringify(weixin_data.post_query)); // clone object
      query['echostr'] = echostr;
      request(app)
        .get('/weixin')
        .query(query)
        .expect(200)
        .expect(echostr)
        .end(function(err, res){
          if (err) throw err;
          done();
        });
    });
  });

  describe('for post requests', function(){
    it('should return 204', function(done){
      request(app)
        .post('/weixin')
        .query(weixin_data.post_query)
        .expect(204)
        .end(function(err, res){
          if (err) throw err;
          done();make_xml_post_request
        });
    });
  });
});

var make_xml_post_request = function() {
  // type('xml') => set('Content-Type', 'text/xml')
  return request(app).post('/weixin').type('xml').query(weixin_data.post_query);
};

describe('subscription functionality', function(){
  describe('when user subscribe weixin account', function(){
    it('should return a welcome message (aka "newly_subscribed")', function(done){
      make_xml_post_request()
        .send(format(weixin_data.subscribe, to, from))
        .expect(200)
        .expect(weixin.respond_with_text(context, config.newly_subscribed))
        .end(function(err, res){
          if (err) throw err;
          done();
        });
    });
  });

  describe('when user unsubscribe weixin account', function(){
    it('should return 204', function(done){
      make_xml_post_request()
        .send(format(weixin_data.unsubscribe, to, from))
        .expect(204)
        .end(function(err, res){
          if (err) throw err;
          done();
        });
    });
  });
});

describe('find nearby stores with position/coordinates functionality', function(){
  var x = config.test.coord.lat, y = config.test.coord.lng;

  var store = require(paths.lib.store);
  // remove stores.json from module caches as its content was manipulated. it will be 're-required'.
  delete require.cache[require.resolve(paths.stores)];
  var stores_list = store.flatten(require(paths.stores));
  var list = store.find_nearby_stores_to_weixin_list(stores_list, x, y);

  var validate_content = function(content, done) {
    var count = config.number_of_nearby_stores_to_list;
    count++; // this is the first banner item;
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
      assert.strictEqual(result.xml.Articles[0].item.length, count, 'wrong number of stores?');
      assert((result.xml.Articles[0].item[0].Title instanceof Array), 'article item title is not an array?');
      assert.strictEqual(result.xml.Articles[0].item[0].Title.join(''), config.title_of_first_nearby_store, 'wrong calculation?');
      assert.strictEqual(result.xml.Articles[0].item[1].Title.join('').split(/\r?\n/)[0], config.test.nearby_store_name, 'wrong calculation?');
      done();
    });
  }

  describe('when user sends his/her coordinates', function(){
    it('should return a list of nearby stores', function(done){
      make_xml_post_request()
        .send(format(weixin_data.find_nearby_stores, to, from, x, y))
        .expect(200)
        .expect(weixin.respond_with_list(context, list))
        .end(function(err, res){
          if (err) throw err;
          validate_content(res.text, done);
        });
    });
  });

  describe('when user send coordinates text', function(){
    it('should return a list of stores near that point', function(done){
      make_xml_post_request()
        .send(format(weixin_data.text, to, from, x + ', ' + y))
        .expect(200)
        .expect(weixin.respond_with_list(context, list))
        .end(function(err, res){
          if (err) throw err;
          validate_content(res.text, done);
        });
    });
  });
});

describe('robot functionality', function(){
  var determine_type = function(robot){
    if (robot.sound) return 'sound';
    if (robot.words) return 'text';
    if (robot.lists) return 'list';
    return null;
  };

  var expect = function(robot, type) {
    switch(type){
    case 'sound':
      return weixin.respond_with_sound(context, robot.sound);
    case 'text':
      return weixin.respond_with_text(context, robot.words);
    case 'list':
      return weixin.respond_with_list(context, weixin.make_robot_list(robot.lists));
    }
    return null;
  }

  var sending_text = function(robot, type, content) {
    describe('when user sends ' + content, function(){
      it('should return a ' + type, function(done){
        make_xml_post_request()
          .send(format(weixin_data.text, to, from, content))
          .expect(200)
          .expect(expect(robot, type))
          .end(function(err, res){
            if (err) throw err;
            done();
          });
      });
    });
  };

  var clicking_menu = function(robot, type, click){
    describe('when user clicks ' + click, function(){
      it('should return a ' + type, function(done){
        make_xml_post_request()
          .send(format(weixin_data.click, to, from, click))
          .expect(200)
          .expect(expect(robot, type))
          .end(function(err, res){
            if (err) throw err;
            done();
          });
      });
    });
  };

  describe('for those robots', function(){
    for (var i = 0; i < config.robots.length; i++) {
      var robot = config.robots[i];
      var tests = robot.tests || [ '' ];
      for (var j = 0; j < tests.length; j++) {
        var type = determine_type(robot);
        if (!type) continue;
        if (robot.click) {
          if (robot.click instanceof Array) {
            for (var k = 0; k < robot.click.length; k++) {
              clicking_menu(robot, type, robot.click[k]);
            }
          } else {
            clicking_menu(robot, type, robot.click);
          }
        } else {
          sending_text(robot, type, tests[j] || robot.exact);
        }
      }
    }
  });
});
