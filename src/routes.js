'use strict';
var Datastore = require('./datastore');

var routes = function(server) {

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      var influx = request.server.plugins['influx'].influx;
      new Datastore(influx).getSummary()
          .then(function(summary){
            var context = {
              spaces: summary
            };
            server.render("index", context, {}, function(err, rendered) {
              if (err) return reply(err);
              reply(rendered);
            });
          })
          .catch(function(err){
            reply(err);
          })
    }
});

// that last 100 values this data poin has had
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/history/{dataname}.json',
  handler: function(request, reply) {
    var limit = 100;
    var offset = 0;

    var influx = request.server.plugins['influx'].influx;
    new Datastore(influx).getHistory(request.params.spacename, request.params.dataname, offset, limit)
        .then(function(data){
          if (data) {
            data.forEach(function(i){
              i.last_updated = Math.round(Date.parse(i.last_updated)/1000);
            });
          }
          reply({
            "offset": offset,
            "limit": limit,
            "count": data.length,
            "data": data
          });
        })
        .catch(function(err){
          request.log.error(err);
          reply("error").code(404);
        });
  }
});

// the latest value of this data point
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}.json',
  handler: function(request, reply) {
    var influx = request.server.plugins['influx'].influx;
    new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(function(result){
          if( result !== undefined ) {
        	  result.last_updated = Math.round(Date.parse(result.last_updated)/1000);
        	  reply(result);
          } else {
        	  request.log.error("No results");
        	  reply("error").code(404);
          }
        })
        .catch(function(err){
          request.log.error(err);
          reply("error").code(404);
        });
  }
});

// the latest value of this data point, as a straight text response
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}.txt',
  handler: function(request, reply) {
    var influx = request.server.plugins['influx'].influx;
    new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(function(result){
          reply(result.value).header('Content-Type', "text/plain");;
        })
        .catch(function(err){
          request.log.error(err);
          reply("error").code(404);
        });
  }
});

// the latest value of this data point, as an rss feed
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}/feed',
  handler: function(request, reply) {
    reply("RSS FEED PEW PEW PEW");
  }
});

// update the value as a GET (but really should be a POST)
// /s/vhs/data/isopen/update?value=closed
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}/update',
  handler: function(request, reply) {
    var influx = request.server.plugins['influx'].influx;
    if (request.url.query.value === undefined) {
      request.log.error(err);
      return reply('forbidden').code(403);
    }
    var ds = new Datastore(influx);
    ds.setIfChanged(request.params.spacename, request.params.dataname, request.url.query.value)
        .then(function(result){
          result.last_updated = Math.round(Date.parse(result.last_updated)/1000);
          reply({"result":result, "status":"OK"});
        })
        .catch(function(err){
          request.log.error(err);
          reply('error').code(500);
        });
  }
});

// returns a jquery snippet that will set the contents of an element with id #<spacename>-<dataname> to the value
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}.js',
  handler: function(request, reply) {
    var influx = request.server.plugins['influx'].influx;
    new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(function(result){
          if (result === null) {
            request.log.error("No results");
            return reply('error').code(404);
          }
          result.space = request.params.spacename;
          server.render("data-widget", {data: result}, {}, function(err, rendered) {
            if (err) return reply(err);
            reply(rendered).header('Content-Type', "application/javascript");
          });
        })
        .catch(function(err){
          request.log.error(err);
          reply('error').code(500);
        });
  }
});

// a basic page showing the latest value and time since last changed
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}/fullpage',
  handler: function(request, reply) {
    var influx = request.server.plugins['influx'].influx;
    new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(function(result){
          var renderContext = {
            data: result,
            space: {name: request.params.spacename}
          };
          server.render("data-full", renderContext, {}, function(err, rendered) {
            if (err) return reply(err);
            reply(rendered);
          });
        })
        .catch(function(err){
          request.log.error(err);
          reply('error').code(404);
        });
  }
});

// a basic page showing two datapoints in a style designed for isvhsopen.com
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname1}/{dataname2}/fullpage',
  handler: function(request, reply) {
    var influx = request.server.plugins['influx'].influx;
    var first, second;
    var ds = new Datastore(influx);
    ds.getLatest(request.params.spacename, request.params.dataname1)
        .then(function(data){
          first = data;
          return ds.getLatest(request.params.spacename, request.params.dataname2)
        })
        .then(function(data){
          second = data;
          var renderContext = {
            datapoint1: first,
            datapoint2: second,
            space: {name: request.params.spacename }
          };
          server.render("data-dual-full", renderContext, {}, function(err, rendered) {
            if (err) return reply(err);
            reply(rendered);
          });
        })
        .catch(function(err){
          request.log.error(err);
          reply('error').code(404);
        });
  }
});

// a verbose page about the datavalue
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}',
  handler: function(request, reply) {
    var influx = request.server.plugins['influx'].influx;
    new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(function (result) {
          if (!result) {
        	request.log.error("No results");
            return reply('error').code(404);
          }

          server.render("data", {space: request.params.spacename, data: result}, {}, function (err, rendered) {
            if (err) return reply(err);
            reply(rendered);
          });
        })
        .catch(function (err) {
          request.log.error(err);
          reply('error').code(404);
        });
  }
});
};

module.exports = routes;
