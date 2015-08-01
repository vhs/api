var Path = require('path');
var Hapi = require('hapi');

var redisOptions = {
    "host": "localhost",
    "opts": {
        "parser": "javascript"
    }
};

var server = new Hapi.Server({});

server.register({
  register: require('hapi-redis'),
  options: redisOptions
}, function () {
  console.log("Redis Registered");
});

server.connection({ port: 3000 });

require('./src/routes')(server);

server.start(function () {
    console.log('Server running at:', server.info.uri);
});