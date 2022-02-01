'use strict';

const debug = require('debug')('vhs-api:config');

const convict = require('convict');

const conf = convict({
  port: {
    doc: 'Listen Port',
    format: 'port',
    default: '8080',
    env: 'PORT',
    arg: 'port',
  },
  influx_host: {
    doc: 'Influx Host',
    default: 'localhost',
    env: 'INFLUX_HOST',
    arg: 'influx-host',
  },
  influx_port: {
    doc: 'Influx Port',
    format: 'port',
    default: '8086',
    env: 'INFLUX_PORT',
    arg: 'influx-port',
  },
  influx_user: {
    doc: 'Influx User',
    default: 'user',
    env: 'INFLUX_USER',
    arg: 'influx-user',
  },
  influx_pw: {
    doc: 'Influx Password',
    default: '',
    env: 'INFLUX_PASSWORD',
    arg: 'influx-pw',
    sensitive: true,
  },
  influx_db: {
    doc: 'Influx DB',
    default: 'api',
    env: 'INFLUX_DB',
    arg: 'influx-db',
  },
  acls: {
    doc: 'ACLs',
    format: Object,
    env: 'ACLS',
    arg: 'acls',
    default: {},
  },
  clients: {
    doc: 'Clients',
    format: Object,
    env: 'CLIENTS',
    arg: 'clients',
    default: {},
  },
});

try {
  conf.loadFile('./etc/config.json');
} catch (err) {
  debug(err);
}

conf.validate({ allowed: 'strict' });

module.exports = conf;
