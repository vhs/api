'use strict';

const Influx = require('influx');

exports.register = function (plugin, options, next) {
  const defaults = {
    host: 'localhost',
    port: 8086,
    username: '',
    password: '',
    protocol: 'http',
    database: 'api',
  };

  options = Object.assign(defaults, options);

  // eslint-disable-next-line new-cap
  const influx = Influx(options);

  plugin.expose('influx', influx);

  plugin.log(['hapi-influx', 'info'], 'InfluxDB connection created');

  return next();
};

exports.register.attributes = {
  name: 'influx',
};
