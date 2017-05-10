var Path = require('path');
var fs = require('fs');

var bunyan = require('bunyan');
var Hapi = require('hapi');
var handlebars = require('handlebars');
var layouts = require('handlebars-layouts');
var debug = require('debug')('vhs-api:index');


var conf = require('./src/config.js');

var influxOptions = {
    // or single-host configuration
    host : conf.get('influx_host'),
    port : conf.get('influx_port'),
    protocol : 'http', // optional, default 'http'
    username : conf.get('influx_user'),
    password : conf.get('influx_pw'),
    database : conf.get('influx_db')
};

var logger = bunyan.createLogger({name: 'api', level: 'info'});

var server = new Hapi.Server({});

handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('main', fs.readFileSync(__dirname + '/views/layouts/main.html', 'utf8'));

server.views({
    engines: { html: handlebars },
    path: __dirname + '/views'
});

server.connection({ port: conf.get('port'), routes: { cors: true } });

server.register([
  {
    register: require('./src/hapi-influx'),
    options: influxOptions
  },
  {
    register: require('hapi-bunyan'),
    options: {logger: logger}
  }],

  function () {
    logger.info('Plugins Registered');
  }
);

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
    logger.info('Server running at:', server.info.uri);
});

