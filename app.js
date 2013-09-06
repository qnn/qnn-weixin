
/**
 * Module dependencies.
 */

var express = require('express');
var index = require('./routes');
var stores = require('./routes/stores');
var weixin = require('./routes/weixin');
var api = require('./routes/api');
var http = require('http');
var path = require('path');
var fs = require('fs');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('json spaces', 0);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var SOCKET_FILE = __dirname + '/tmp/sockets/node.socket';
fs.exists(SOCKET_FILE, function(exists){
  if (exists) fs.unlinkSync(SOCKET_FILE);
});

// production only
if ('production' == app.get('env')) {
  app.set('port', SOCKET_FILE);
}

app.get('/', index.index);
app.get('/stores', stores.list_all);
app.get('/weixin/bridge', weixin.bridge)

app.get('/api/stores', api.stores);

http.createServer(app).listen(app.get('port'), function(){
  fs.chmodSync(SOCKET_FILE, 666); // some system need this to work right;
  console.log('Express server listening on port ' + app.get('port'));
});
