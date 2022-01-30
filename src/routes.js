'use strict';

const Datastore = require('./datastore');

// Const debug = require('debug')('vhs-api:routes');

// const conf = require('./config.js');

const auth = require('./auth');

const routes = function (server) {
  server.route({
    method: 'GET',
    path: '/',
    handler(request, reply) {
      const { influx } = request.server.plugins.influx;
      new Datastore(influx).getSummary()
        .then(summary => {
          const context = {
            spaces: summary,
          };
          server.render('index', context, {}, (err, rendered) => {
            if (err) {
              return reply(err);
            }

            reply(rendered);
          });
        }).catch(err => {
          reply(err);
        });
    },
  });

  // That last 100 values this data poin has had
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/history/{dataname}.json',
    handler(request, reply) {
      let limit = 100;
      let offset = 0;

      if (request.query.offset !== undefined && typeof parseInt(request.query.offset) === 'number') {
        offset = parseInt(request.query.offset);
      }

      if (request.query.limit !== undefined && typeof parseInt(request.query.limit) === 'number') {
        limit = parseInt(request.query.limit);
      }

      const { influx } = request.server.plugins.influx;
      new Datastore(influx).getHistory(request.params.spacename, request.params.dataname, offset, limit)
        .then(data => {
          if (data) {
            data.forEach(i => {
              i.last_updated = Math.round(Date.parse(i.last_updated) / 1000);
            });
          }

          reply({
            offset,
            limit,
            count: data.length,
            data,
          }).header('Content-Type', 'application/json');
        })
        .catch(err => {
          request.log.error(err);
          reply('error').code(404);
        });
    },
  });

  // The latest value of this data point
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}.json',
    handler(request, reply) {
      const { influx } = request.server.plugins.influx;
      new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(result => {
          if (result === undefined) {
            request.log.error('No results');
            reply('error').code(404);
          } else {
            result.last_updated = Math.round(Date.parse(result.last_updated) / 1000);
            reply(result);
          }
        })
        .catch(err => {
          request.log.error(err);
          reply('error').code(404);
        });
    },
  });

  // The latest value of this data point, as a straight text response
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}.txt',
    handler(request, reply) {
      const { influx } = request.server.plugins.influx;
      new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(result => {
          reply(result.value).header('Content-Type', 'text/plain');
        })
        .catch(err => {
          request.log.error(err);
          reply('error').code(404);
        });
    },
  });

  // The latest value of this data point, as an rss feed
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}/feed',
    handler(request, reply) {
      reply('RSS FEED PEW PEW PEW');
    },
  });

  // Update value
  // /s/vhs/data/isopen/update?value=closed
  server.route({
    method: 'PUT',
    path: '/s/{spacename}/data/{dataname}/update',
    handler(request, reply) {
      // Check input
      if (request.payload.value === undefined) {
        request.log.error('Missing value argument');
        return reply('Forbidden - Missing value argument').code(400);
      }

      // Check auth
      if (auth.matchACL(request.url.pathname)) {
        if ((request.payload.client === undefined) || (request.payload.ts === undefined) || (request.url.query.hash === undefined)) {
          request.log.error('Missing authorization fields');
          return reply('Not Authorized - Missing authorization fields').code(401);
        }

        const verified = auth.verifyRequest(JSON.stringify(request.payload), request.url.pathname, request.payload.client, request.payload.ts, request.url.query.hash);

        if (!verified) {
          request.log.error('failed HMAC for: [' + request.url.pathname + ']');
          return reply('Not Authorized - Failed Authentication').code(403);
        }
      }

      const { influx } = request.server.plugins.influx;

      const ds = new Datastore(influx);

      ds.setIfChanged(request.params.spacename, request.params.dataname, request.payload.value)
        .then(result => {
          result.last_updated = Math.round(Date.parse(result.last_updated) / 1000);
          reply({ result, status: 'OK' });
        })
        .catch(err => {
          request.log.error(err);
          reply('error').code(500);
        });
    },
  });

  // Keep GET method for backward compatibility for now
  //
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}/update',
    handler(request, reply) {
      // Check for valid input
      if (request.url.query.value === undefined) {
        request.log.error('Missing value argument');
        return reply('Forbidden - Missing value argument').code(400);
      }

      // Check auth
      if (auth.matchACL(request.url.pathname)) {
        if ((request.url.query.client === undefined) || (request.url.query.ts === undefined) || (request.url.query.hash === undefined)) {
          request.log.error('Missing authorization fields');
          return reply('Not Authorized - Missing authorization fields').code(401);
        }

        const requestUrl = request.url.pathname + '?value=' + request.url.query.value;

        const verified = auth.verifyRequest(requestUrl, request.url.pathname, request.url.query.client, request.url.query.ts, request.url.query.hash);

        if (!verified) {
          request.log.error('failed HMAC for:');
          request.log.error(request.url);
          return reply('Not Authorized - Failed Authentication').code(403);
        }
      }

      const { influx } = request.server.plugins.influx;
      const ds = new Datastore(influx);
      ds.setIfChanged(request.params.spacename, request.params.dataname, request.url.query.value)
        .then(result => {
          result.last_updated = Math.round(Date.parse(result.last_updated) / 1000);
          reply({ result, status: 'OK' });
        })
        .catch(err => {
          request.log.error(err);
          reply('Error in query').code(500);
        });
    },
  });

  // Returns a jquery snippet that will set the contents of an element with id
  // #<spacename>-<dataname> to the value
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}.js',
    handler(request, reply) {
      const { influx } = request.server.plugins.influx;

      new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(result => {
          if (result === null) {
            request.log.error('No results');
            return reply('error').code(404);
          }

          result.space = request.params.spacename;
          server.render('data-widget', { data: result }, {}, (err, rendered) => {
            if (err) {
              return reply(err);
            }

            reply(rendered).header('Content-Type', 'application/javascript');
          });
        })
        .catch(err => {
          request.log.error(err);
          reply('error').code(500);
        });
    },
  });

  // A basic page showing the latest value and time since last changed
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}/fullpage',
    handler(request, reply) {
      const { influx } = request.server.plugins.influx;
      new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(result => {
          const renderContext = {
            data: result,
            space: { name: request.params.spacename },
          };
          server.render('data-full', renderContext, {}, (err, rendered) => {
            if (err) {
              return reply(err);
            }

            reply(rendered);
          });
        })
        .catch(err => {
          request.log.error(err);
          reply('error').code(404);
        });
    },
  });

  // A basic page showing two datapoints in a style designed for isvhsopen.com
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname1}/{dataname2}/fullpage',
    handler(request, reply) {
      const { influx } = request.server.plugins.influx;
      const ds = new Datastore(influx);

      let first;
      let second;

      ds.getLatest(request.params.spacename, request.params.dataname1)
        .then(data => {
          first = data;
          return ds.getLatest(request.params.spacename, request.params.dataname2);
        })
        .then(data => {
          second = data;
          const renderContext = {
            datapoint1: first,
            datapoint2: second,
            space: { name: request.params.spacename },
          };
          server.render('data-dual-full', renderContext, {}, (err, rendered) => {
            if (err) {
              return reply(err);
            }

            reply(rendered);
          });
        })
        .catch(err => {
          request.log.error(err);
          reply('error').code(404);
        });
    },
  });

  // A verbose page about the datavalue
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}',
    handler(request, reply) {
      const { influx } = request.server.plugins.influx;
      new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(result => {
          if (!result) {
            request.log.error('No results');
            return reply('error').code(404);
          }

          server.render('data', { space: request.params.spacename, data: result }, {}, (err, rendered) => {
            if (err) {
              return reply(err);
            }

            reply(rendered);
          });
        })
        .catch(err => {
          request.log.error(err);
          reply('error').code(404);
        });
    },
  });
};

module.exports = routes;
