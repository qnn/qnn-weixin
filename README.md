QNN-Stores
==========

A management tool for QNN stores. This tool also provides API to find the nearest stores.

How to use
----------

Nginx configurations:

    upstream qnn_stores_app {
      server unix:///srv/qnn-stores/tmp/sockets/node.socket;
    }
    
    server {
      listen 80;
      server_name <SERVER_NAME>;
      client_max_body_size 1m;
      keepalive_timeout 5;
      root /srv/qnn-stores/public;
      access_log /srv/qnn-stores/log/production.access.log;
      error_log /srv/qnn-stores/log/production.error.log info;
      error_page 500 502 503 504 /500.html;
      location = /500.html {
        root /srv/qnn-stores/public;
      }
      try_files $uri/index.html $uri.html $uri @app;
      location @app {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $http_host;
        proxy_redirect off;
        proxy_pass http://qnn_stores_app;
      }
    }

Start Node:

    export NODE_ENV=production
    forever start app.js
