process.env['NODE_ENV'] = 'test';

var app = require('../app');
var request = require('supertest');
var assert = require('assert');

describe('given latitude and longitutde', function(){
  it('should return a list of nearby stores', function(done){
    var count = 5;
    request(app)
      .get('/api/stores')
      .query({
        lat: 22.849068,
        lng: 113.216673,
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
        assert.strictEqual(body.stores[0][0], '佛山大良专卖店', 'wrong calculation?');
        done();
      });
  });
});
