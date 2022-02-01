const fs = require('fs');
const Path = require('path');

const bunyan = require('bunyan');
const Hapi = require('@hapi/hapi');
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

const server = new Hapi.Server({
  port: conf.get('port'),
  routes: {
    cors: true,
    files: {
      relativeTo: Path.join(__dirname, 'public'),
    },
  },
});

const provision = async () => {
  await server.register(require('@hapi/inert'));
  await server.register(require('@hapi/vision'));

  handlebars.registerHelper(layouts(handlebars));

  handlebars.registerPartial('main', fs.readFileSync(__dirname + '/views/layouts/main.html', 'utf8'));

  server.views({
    engines: {
      html: handlebars,
    },
    relativeTo: __dirname,
    path: 'views',
  });

  await server.register({ plugin: require('./src/hapi-influx'), options: influxOptions });
  await server.register({ plugin: require('hapi-pino'), options: { redact: ['req.headers.authorization'] } });

  logger.info('Plugins Registered');

  require('./src/routes')(server);

  // Static assets
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: Path.join(__dirname, 'public'),
      },
    },
  });

  await server.start();

  logger.info('Server running at:', server.info.uri);
};

provision();
