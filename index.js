var Path = require('path');
var fs = require('fs');

var convict = require('convict');
var bunyan = require('bunyan');
var Hapi = require('hapi');
var handlebars = require('handlebars');
var layouts = require('handlebars-layouts');

var conf = convict({
    port: {
        doc: 'Listen Port',
        format: 'port',
        default: '8080',
        env: 'PORT',
        arg: 'port'
    },
    redis_host: {
        doc: 'Redis Host',
        format: 'ipaddress',
        default: '127.0.0.1',
        env: 'REDIS_PORT_6379_TCP_ADDR',
        arg: 'redis-host'
    },
    redis_port: {
        doc: 'Redis Port',
        format: 'port',
        default: '6379',
        env: 'REDIS_PORT_6379_TCP_PORT',
        arg: 'redis-port'
    }
});

var redisOptions = {
    'host': conf.get('redis_host'),
    'port': conf.get('redis_port'),
    'opts': {
        'parser': 'javascript'
    }
};

var logger = bunyan.createLogger({name: 'api', level: 'info'});

logger.info('Redis config', redisOptions);

var server = new Hapi.Server({});

handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('main', fs.readFileSync(__dirname + '/views/layouts/main.html', 'utf8'));

server.views({
    engines: { html: handlebars },
    path: __dirname + '/views'
});

server.register([
  {
    register: require('hapi-redis'),
    options: redisOptions
  },
  {
    register: require('hapi-bunyan'),
    options: {logger: logger}
  }],
  function () {
    logger.info('Plugins Registered');
  }
);

server.connection({ port: conf.get('port') });

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
