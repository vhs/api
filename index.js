const fs = require('fs');

const bunyan = require('bunyan');
const Hapi = require('hapi');
const handlebars = require('handlebars');
const layouts = require('handlebars-layouts');

const conf = require('./src/config.js');

const influxOptions = {
  // Or single-host configuration
  host: conf.get('influx_host'),
  port: conf.get('influx_port'),
  protocol: 'http', // Optional, default 'http'
  username: conf.get('influx_user'),
  password: conf.get('influx_pw'),
  database: conf.get('influx_db'),
};

const logger = bunyan.createLogger({ name: 'api', level: 'info' });

const server = new Hapi.Server({});

handlebars.registerHelper(layouts(handlebars));
handlebars.registerPartial('main', fs.readFileSync(__dirname + '/views/layouts/main.html', 'utf8'));

server.views({
  engines: { html: handlebars },
  path: __dirname + '/views',
});

server.connection({ port: conf.get('port'), routes: { cors: true } });

server.register([
  {
    register: require('./src/hapi-influx'),
    options: influxOptions,
  },
  {
    register: require('hapi-bunyan'),
    options: { logger },
  },
],

() => {
  logger.info('Plugins Registered');
},
);

require('./src/routes')(server);

// Static assets
server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: 'public',
    },
  },
});

server.start(() => {
  logger.info('Server running at:', server.info.uri);
});

