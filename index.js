var Path = require('path');
var fs = require('fs');

var Hapi = require('hapi');
var handlebars = require('handlebars');
var layouts = require('handlebars-layouts');

var redisOptions = {
    "host": "192.168.88.44",
    "opts": {
        "parser": "javascript"
    }
};

var server = new Hapi.Server({});
 
handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('main', fs.readFileSync(__dirname + '/views/layouts/main.html', 'utf8'));

server.views({
    engines: { html: handlebars },
    path: __dirname + '/views'
});

server.register({
  register: require('hapi-redis'),
  options: redisOptions
}, function () {
  console.log("Redis Registered");
});

server.connection({ port: 8080 });

require('./src/routes')(server);

// static assets
server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: 'public'
        }
    }
});

server.start(function () {
    console.log('Server running at:', server.info.uri);
});