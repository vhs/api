'use strict';
const Boom = require('@hapi/boom');

const Datastore = require('./datastore');

const throwError = function (err, statusCode) {
  statusCode = statusCode || 500;

  const errInst = Boom.badRequest(err);

  errInst.output.statusCode = statusCode;

  return errInst;
};

const auth = require('./auth');

module.exports = function (server) {
  server.route({
    method: 'GET',
    path: '/',
    handler: async (request, h) => {
      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);

        const summary = await datastore.getSummary();

        return h.view('index', {
          spaces: summary,
        });
      } catch (err) {
        throw throwError(err);
      }
    },
  });

  // That last 100 values this data poin has had
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/history/{dataname}.json',
    handler: async (request, h) => {
      let limit = 100;
      let offset = 0;

      if (request.query.offset !== undefined && typeof parseInt(request.query.offset) === 'number') {
        offset = parseInt(request.query.offset);
      }

      if (request.query.limit !== undefined && typeof parseInt(request.query.limit) === 'number') {
        limit = parseInt(request.query.limit);
      }

      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);

        const data = await datastore.getHistory(request.params.spacename, request.params.dataname, offset, limit);

        if (data) {
          data.forEach(i => {
            i.last_updated = Math.round(Date.parse(i.last_updated) / 1000);
          });
        }

        const response = h.response({
          offset,
          limit,
          count: data.length,
          data,
        });

        response.type('application/json');

        return response;
      } catch (err) {
        request.logger.error(err);

        throw throwError('error', 404);
      }
    },
  });

  // That last 100 values this data poin has had
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}/history.json',
    handler: async (request, h) => {
      let limit = 100;
      let offset = 0;

      if (request.query.offset !== undefined && typeof parseInt(request.query.offset) === 'number') {
        offset = parseInt(request.query.offset);
      }

      if (request.query.limit !== undefined && typeof parseInt(request.query.limit) === 'number') {
        limit = parseInt(request.query.limit);
      }

      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);

        const data = await datastore.getHistory(request.params.spacename, request.params.dataname, offset, limit);

        if (data) {
          data.forEach(i => {
            i.last_updated = Math.round(Date.parse(i.last_updated) / 1000);
          });
        }

        const response = h.response({
          offset,
          limit,
          count: data.length,
          data,
        });

        response.type('application/json');

        return response;
      } catch (err) {
        request.logger.error(err);

        throw throwError('error', 404);
      }
    },
  });

  // The latest value of this data point
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}.json',
    handler: async (request, h) => {
      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);
        const result = await datastore.getLatest(request.params.spacename, request.params.dataname);

        if (result === undefined) {
          request.logger.error('No results');

          throwError('error', 404);
        } else {
          result.last_updated = Math.round(Date.parse(result.last_updated) / 1000);

          const response = h.response(result);

          response.type('application/json');

          return response;
        }
      } catch (err) {
        throw throwError(err, 500);
      }
    },
  });

  // The latest value of this data point, as a straight text response
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}.txt',
    handler: async (request, h) => {
      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);
        const result = await datastore.getLatest(request.params.spacename, request.params.dataname);

        if (result) {
          const response = h.response(result.value);

          response.header('Content-Type', 'text/plain');

          return response;
        }
      } catch (err) {
        throw throwError(err, 500);
      }
    },
  });

  // The latest value of this data point, as an rss feed
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}/feed',
    handler: async (request, h) => h.response('RSS FEED PEW PEW PEW'),
  });

  // Update value
  // /s/vhs/data/isopen/update?value=closed
  server.route({
    method: 'PUT',
    path: '/s/{spacename}/data/{dataname}/update',
    handler: async (request, h) => {
      // Check input
      if (request.query.value === undefined) {
        request.logger.error('Missing value argument');

        // Throw throwError('Forbidden - Missing value argument', 400);
        throw throwError('Missing value argument', 400);
      }

      // Check auth
      if (auth.matchACL(request.url.pathname)) {
        if ((request.payload === null) || (request.payload.client === undefined) || (request.payload.ts === undefined) || (request.query.hash === undefined)) {
          request.logger.error('Missing authorization fields');

          throw throwError('Not Authorized - Missing authorization fields', 401);
        }

        const verified = auth.verifyRequest(JSON.stringify(request.payload), request.url.pathname, request.payload.client, request.payload.ts, request.query.hash);

        if (!verified) {
          request.logger.error('failed HMAC for: [' + request.url.pathname + ']');

          throw throwError('Not Authorized - Failed Authentication', 403);
        }
      }

      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);

        const result = await datastore.setIfChanged(request.params.spacename, request.params.dataname, request.query.value);

        result.last_updated = Math.round(Date.parse(result.last_updated) / 1000);

        return h.response({ result, status: 'OK' });
      } catch (err) {
        request.logger.error(err);

        throw throwError('error', 500);
      }
    },
  });

  // Keep GET method for backward compatibility for now
  //
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}/update',
    handler: async (request, h) => {
      // Check for valid input
      if (request.query.value === undefined) {
        request.logger.error('Missing value argument');

        throw throwError('Forbidden - Missing value argument', 403);
      }

      // Check auth
      if (auth.matchACL(request.url.pathname)) {
        if ((request.payload === null) || (request.query.client === undefined) || (request.query.ts === undefined) || (request.query.hash === undefined)) {
          request.logger.error('Missing authorization fields');

          throw throwError('Not Authorized - Missing authorization fields', 401);
        }

        const requestUrl = request.url.pathname + '?value=' + request.query.value;

        const verified = auth.verifyRequest(requestUrl, request.url.pathname, request.query.client, request.query.ts, request.query.hash);

        if (!verified) {
          request.logger.error('failed HMAC for:');

          request.logger.error(request.url);

          throw throwError('Not Authorized - Failed Authentication', 403);
        }
      }

      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);

        const result = await datastore.setIfChanged(request.params.spacename, request.params.dataname, request.query.value);

        result.last_updated = Math.round(Date.parse(result.last_updated) / 1000);

        return h.response({ result, status: 'OK' });
      } catch (err) {
        request.logger.error(err);

        throw throwError('Error in query', 500);
      }
    },
  });

  // Returns a jquery snippet that will set the contents of an element with id
  // #<spacename>-<dataname> to the value
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}.js',
    handler: async (request, h) => {
      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);
        const result = await datastore.getLatest(request.params.spacename, request.params.dataname);

        if (result === null) {
          request.logger.error('No results');

          throw throwError('error', 404);
        }

        result.space = request.params.spacename;

        const response = h.view('data-widget', { data: result });

        response.type('application/javascript');

        return response;
      } catch (err) {
        request.logger.error(err);

        throw throwError('error', 500);
      }
    },
  });

  // A basic page showing the latest value and time since last changed
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}/fullpage',
    handler: async (request, h) => {
      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);
        const result = await datastore.getLatest(request.params.spacename, request.params.dataname);

        const renderContext = {
          data: result,
          space: { name: request.params.spacename },
        };

        return h.view('data-full', renderContext, {}).type('text/html');
      } catch (err) {
        request.logger.error(err);

        throwError('error', 404);
      }
    },
  });

  // A basic page showing two datapoints in a style designed for isvhsopen.com
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname1}/{dataname2}/fullpage',
    handler: async (request, h) => {
      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);

        const first = await datastore.getLatest(request.params.spacename, request.params.dataname1);

        const second = await datastore.getLatest(request.params.spacename, request.params.dataname2);

        const renderContext = {
          datapoint1: first,
          datapoint2: second,
          space: { name: request.params.spacename },
        };

        return h.view('data-dual-full', renderContext, {});
      } catch (err) {
        request.logger.error(err);

        throwError('error', 404);
      }
    },
  });

  // A verbose page about the datavalue
  server.route({
    method: 'GET',
    path: '/s/{spacename}/data/{dataname}',
    handler: async (request, h) => {
      const { influx } = request.server.plugins.influx;

      try {
        const datastore = new Datastore(influx);
        const result = await datastore.getLatest(request.params.spacename, request.params.dataname);

        if (!result) {
          request.logger.error('No results');

          throw throwError('error', 404);
        }

        const responseData = { space: request.params.spacename, data: result };

        responseData.data.last_updated = new Date(result.last_updated).toISOString();

        return h.view('data', responseData, {});
      } catch (err) {
        request.logger.error(err);

        throwError('error', 404);
      }
    },
  });
};
