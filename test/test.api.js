process.env['NODE_ENV'] = 'test';

require('js-yaml');

var app     = require('../app');
var request = require('supertest');
var assert  = require('assert');

var paths   = require('../paths');
var config  = require(paths.config);

describe('given nothing', function(){
  it('should return all stores', function(done){
    request(app)
      .get('/api/stores')
      .expect(200)
      .end(function(err, res){
        if (err) throw err;
        var body = res.body;
        assert(body.hasOwnProperty('stores'), 'not stores?');
        assert((body.stores instanceof Array), 'no stores?');
        assert.strictEqual(body.stores.length, 10, 'wrong number of stores?');
        done();
      });
  });
});

describe('given latitude and longitutde', function(){
  it('should return a list of nearby stores', function(done){
    var count = 5;
    request(app)
      .get('/api/stores')
      .query({
        lat: config.test.coord.lat,
        lng: config.test.coord.lng,
        start: 0,
        count: count
      })
      .expect(200)
      .end(function(err, res){
        if (err) throw err;
        var body = res.body;
        assert(body.hasOwnProperty('stores'), 'not stores?');
        assert((body.stores instanceof Array), 'no stores?');
        assert.strictEqual(body.stores.length, count, 'wrong number of stores?');
        assert.strictEqual(body.stores[0][0], config.test.nearby_store_name, 'wrong calculation?');
        done();
      });
  });
});
