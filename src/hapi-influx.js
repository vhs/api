'use strict';
var Influx = require('influx');

exports.register = function(plugin, options, next) {
    var defaults, influx;
    defaults = {
        host: 'localhost',
        port: 8086,
        username: '',
        password: '',
        protocol : 'http',
        database: 'api'
    };

    options = Object.assign(defaults, options);
    plugin.expose('influx', Influx(options));
    plugin.log(['hapi-influx', 'info'], 'InfluxDB connection created');
    return next();
};

exports.register.attributes = {
    name: 'influx'
};
