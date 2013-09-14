var express = require('express');
var http    = require('http');
var path    = require('path');
var fs      = require('fs');
var app     = express();

// all environments
app.set('port',        process.env.PORT || 3000);
app.set('views',       __dirname + '/views');
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

if (fs.existsSync(SOCKET_FILE)) {
  fs.unlinkSync(SOCKET_FILE);
}

// production only
if ('production' == app.get('env')) {
  app.set('port', SOCKET_FILE);
}

// routes:
var web    = require('./routes/web');
var weixin = require('./routes/weixin');
var api    = require('./routes/api');

// web:
app.get('/'               , web.index);
app.get('/stores/:store?' , web.stores);
app.get('/maps'           , web.maps);
app.get('/lists/:list'    , web.lists);

// weixin:
app.get('/weixin'         , weixin.get);
app.post('/weixin'        , weixin.post);

// api:
app.get('/api/stores'     , api.stores);

// if nothing matches, return 404
app.use(function(req, res){
  res.status(404).render('404');
});

http.createServer(app).listen(app.get('port'), function(){
  if (fs.existsSync(SOCKET_FILE)) {
    fs.chmodSync(SOCKET_FILE, 666); // some system need this to work right;
  }
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
