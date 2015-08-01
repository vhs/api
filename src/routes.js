
var Datapoint = require('./datapoint');

var routes = function(server) {

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      server.render("index",{},{}, function(err, rendered) {
        if (err) return reply(err);
        reply(rendered);
      });
    }
});

// that last 100 values this data poin has had
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/history/{dataname}.json',
  handler: function(request, reply) {
    var redisClient = request.server.plugins['hapi-redis'].client;
    datapoint.history(redisClient, request.params.spacename, request.params.dataname, function(err, datapoints) {
      if (err) {
        reply("404");
      } else {
        reply({
          "offset":"0",
          "limit":"100",
          "count": datapoints.length,
          "data": datapoints
        });
      }
    });
  }
});

// the latest value of this data point
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}.json',
  handler: function(request, reply) {
    var redisClient = request.server.plugins['hapi-redis'].client;
    datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        reply("404");
      } else {
        reply(data);  
      }
    });
  }
});

// the latest value of this data point, as a straight text response
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}.txt',
  handler: function(request, reply) {
    var redisClient = request.server.plugins['hapi-redis'].client;
    datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        reply("404");
      } else {
        reply(data.value);
      }
    });
  }
});

// the latest value of this data point, as an rss feed
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}/feed',
  handler: function(request, reply) {
    var redisClient = request.server.plugins['hapi-redis'].client;
    datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        reply("404");
      } else {
        reply("RSS FEED PEW PEW PEW");
      }
    });
  }
});

// update the value as a GET (but really should be a POST)
// /s/vhs/data/isopen/update?value=closed
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}/update',
  handler: function(request, reply) {
    var redisClient = request.server.plugins['hapi-redis'].client;
    datapoint.set(redisClient, request.params.spacename, request.params.dataname, request.params.value, function(err, data) {
      if (err) {
        reply("404");
      } else {
        reply({"status":"OK","result":{"last_updated":1438457954,"value":"cat","name":"meow"}})
      }
    });
  }
});

// returns a jquery snippet that will set the contents of an element with id #<spacename>-<dataname> to the value
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}.js',
  handler: function(request, reply) {
    var redisClient = request.server.plugins['hapi-redis'].client;
    datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        reply("404");
      } else {
         server.render("data-widget", data, {}, function(err, rendered) {
          if (err) return reply(err);
          reply(rendered);
        });
      }
    });
  }
});

// a basic page showing the latest value and time since last changed
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}/fullpage',
  handler: function(request, reply) {
    var redisClient = request.server.plugins['hapi-redis'].client;
    datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        reply("404");
      } else {
        server.render("data-full", data, {}, function(err, rendered) {
          if (err) return reply(err);
          reply(rendered);
        });
      }
    });
  }
});

// a verbose page about the datavalue
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}',
  handler: function(request, reply) {
     var redisClient = request.server.plugins['hapi-redis'].client;
    datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        reply("404");
      } else {
        server.render("data", data, {}, function(err, rendered) {
          if (err) return reply(err);
          reply(rendered);
        });
      }
    });
  }
});
}

module.exports = routes;
