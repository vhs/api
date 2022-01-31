'use strict';

const Influx = require('influx');

module.exports = {
  name: 'influx',
  async register(server, options) {
    const defaults = {
      host: 'localhost',
      port: 8086,
      username: '',
      password: '',
      protocol: 'http',
      database: 'api',
    };

    options = Object.assign(defaults, options);

    const influx = new Influx.InfluxDB(options);

    server.expose('influx', influx);

    server.log(['hapi-influx', 'info'], 'InfluxDB connection created');
  },
};
