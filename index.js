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
    influx_host: {
        doc: 'Influx Host',
        default: 'localhost',
        env: 'INFLUX_HOST',
        arg: 'influx-host'
    },
    influx_port: {
        doc: 'Influx Port',
        format: 'port',
        default: '8086',
        env: 'INFLUX_PORT',
        arg: 'influx-port'
    },
    influx_user: {
        doc: 'Influx User',
        default: 'user',
        env: 'INFLUX_USER',
        arg: 'influx-user'
    },
    influx_pw: {
        doc: 'Influx Password',
        default: '',
        env: 'INFLUX_PASSWORD',
        arg: 'influx-pw'
    },
    influx_db: {
        doc: 'Influx DB',
        default: 'api',
        env: 'INFLUX_DB',
        arg: 'influx-db'
    }
});

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

server.connection({ port: conf.get('port') });

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