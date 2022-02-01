'use strict';

const handlers = require('./handlers');

module.exports = function (server) {
  server.route({ method: 'GET', path: '/', handler: handlers['default-index'] });

  // That last 100 values this data point in JSON
  server.route({ method: 'GET', path: '/s/{spacename}/data/history/{dataname}.json', handler: handlers['datapoint-history'] });
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}/history.json', handler: handlers['datapoint-history'] });

  // The latest value of this data point
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}.json', handler: handlers['datapoint-latest-json'] });

  // Returns a jquery snippet that will set the contents of an element with id
  // #<spacename>-<dataname> to the value
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}.js', handler: handlers['datapoint-js'] });

  // The latest value of this data point, as a straight text response
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}.txt', handler: handlers['datapoint-latest-txt'] });

  // The latest value of this data point, as an rss feed
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}/feed', handler: handlers['datapoint-feed'] });

  // Update value
  server.route({ method: 'PUT', path: '/s/{spacename}/data/{dataname}/update', handler: handlers['datapoint-update-put'] });

  // Keep GET method for backward compatibility for now
  // /s/vhs/data/isopen/update?value=closed
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}/update', handler: handlers['datapoint-update-get'] });

  // A verbose page about the datavalue
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}', handler: handlers['datapoint-index'] });

  // A basic page showing the latest value and time since last changed
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}/fullpage', handler: handlers['datapoint-fullpage'] });
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname}/fullpage.html', handler: handlers['datapoint-fullpage'] });

  // A basic page showing two datapoints in a style designed for isvhsopen.com
  server.route({ method: 'GET', path: '/s/{spacename}/data/{dataname1}/{dataname2}/fullpage', handler: handlers['combined-fullpage'] });
};
