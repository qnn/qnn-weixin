QNN-Weixin
==========

A Weixin (WeChat) management tool for QNN.

[![Build Status](https://travis-ci.org/qnn/qnn-weixin.png?branch=master)](https://travis-ci.org/qnn/qnn-weixin)

Scan QRCode in Weixin to follow QNN:

[![Weixin QRCode](https://raw.github.com/qnn/qnn-weixin/master/public/images/weixin_qrcode.png)](http://weixin.qq.com/r/rnUvN2PEYj4drSdU9yC8)

Features
--------

✔ Text, audio and list response to subscription, menu clicks, or text request.  
✔ Menu manipulation.  
✔ Find stores near you (via coordinates).  
✔ Automatically find coordinates using Baidu Maps.

How to use
----------

Nginx configurations:

    upstream qnn_weixin_app {
      server unix:///srv/qnn-weixin/tmp/sockets/node.socket;
    }
    
    server {
      listen 80;
      server_name <SERVER_NAME>;
      client_max_body_size 1m;
      keepalive_timeout 5;
      root /srv/qnn-weixin/public;
      access_log /srv/qnn-weixin/log/production.access.log;
      error_log /srv/qnn-weixin/log/production.error.log info;
      error_page 500 502 503 504 /500.html;
      location = /500.html {
        root /srv/qnn-weixin/public;
      }
      try_files $uri/index.html $uri.html $uri @app;
      location @app {
        proxy_intercept_errors on;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;
        proxy_pass http://qnn_weixin_app;
      }
    }

Install dependencies for the first time:

    npm install

Start app in production mode:

    jake start

Start app locally in development mode:

    npm start

To see more jake tasks, run ``jake``. To test this app, run ``npm test``.

    jake start          # forever start  
    jake restart        # forever restart  
    jake stop           # forever stop  
    jake list           # forever list  
    jake menu:show      # show current menu  
    jake menu:create    # create/update menu  
    jake menu:destroy   # destroy current menu  
    jake token          # create or update token file  
    jake coord          # find coordinates  

Global Modules
--------------

* jake (``npm install -g jake``)
* forever

Find coordinates
----------------

Simply run ``jake coord`` to automatically query Baidu Maps for coordinates to those addresses without coordinates in ``stores.json`` and save them.

Developer
---------

* caiguanhao &lt;caiguanhao@gmail.com&gt;
