QNN-Weixin [![Build Status](https://travis-ci.org/qnn/qnn-weixin.png?branch=master)](https://travis-ci.org/qnn/qnn-weixin)
==========

A Weixin (WeChat) management tool for QNN.  
This Weixin app is designed for QNN and may not best suit your project.  
It is recommened you copy some useful code and write your own Weixin app.  
The code may be updated to use newer software, but new features are not planned.  
Scan the following QRCode in Weixin to follow QNN:

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

Install Grunt and pm2 for the first time:

    npm -g i grunt-cli jake forever

Install dependencies:

    npm install

Start app in production mode:

    jake start

Or you can start app locally in development mode:

    npm start

To see more jake tasks, run ``jake``.

    jake start     # forever start
    jake restart   # forever restart
    jake stop      # forever stop
    jake list      # forever list

To see more grunt tasks, run ``grunt --help``.

    Available tasks
         menu:show  Show current Weixin menu.                                      
       menu:update  Update current Weixin menu.      
      menu:destroy  Destroy current Weixin menu.
             token  Update token file.
             coord  Find coordinates.

To test this app, run ``npm test``.

In Windows, available tasks are ``npm run-script s``, ``npm run-script t``.

Forever is still used and not to use pm2 for now because pm2 has [process-spawn problem](https://github.com/Unitech/pm2/issues/235) and its cluster mode has [compatibility problems](https://github.com/Unitech/pm2/issues/231) in node v0.10.

Menu
----

If your Weixin account is type of Service Account, it has the privileges to customize Weixin's menu.  
You'll need a valid appid and appsecret in token.json.  
You can enter these secret tokens by running ``grunt token``.

Run ``grunt menu:show`` to see if local menu is the same as the remote one.

    Success: Got access token.
    >>> Local Menu <<<
    menus:
      全能之家:
        全能官网: http://www.qnnsafe.com/
        招商加盟: http://www.qnnsafe.com.cn/
        全能产品: MENU_PRODUCTS
      自助服务:
        导购精灵: MENU_BUYERS_GUIDE
        网点查询: MENU_FIND_STORE
        天猫旗舰: http://qnn.tmall.com/
        常见问题: MENU_FAQ
        清洁保养: MENU_CLEAN
      活动专区:
        全能资讯: http://www.qnnsafe.com/news/
    >>> Remote Menu <<<
    menus:
      全能之家:
        全能官网: http://www.qnnsafe.com/
        招商加盟: http://www.qnnsafe.com.cn/
        全能产品: MENU_PRODUCTS
      自助服务:
        导购精灵: MENU_BUYERS_GUIDE
        网点查询: MENU_FIND_STORE
        天猫旗舰: http://qnn.tmall.com/
        常见问题: MENU_FAQ
        清洁保养: MENU_CLEAN
      活动专区:
        全能资讯: http://www.qnnsafe.com/news/
    Nothing to do! Local menu is the same as the remote one.

Run ``grunt menu:update`` to update remote menu with the local one described in ``config.yml``.  
Run ``grunt menu:destroy`` to remove the remote menu.  
No need to remove the menu before updating it.

For most of subscribers/followers, the menu will be updated in 24 hours.
So if you want to see the latest menu instantly, according to Weixin's documentation, you'll need to resubscribe the account.

Find coordinates
----------------

Simply run ``grunt coord`` to automatically query Baidu Maps for coordinates to those addresses without coordinates in ``stores.json`` and save them.

Developer
---------

* caiguanhao &lt;caiguanhao@gmail.com&gt;
