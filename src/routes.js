var async = require('async');

var Datapoint = require('./datapoint');
var Spaces = require('./spaces');


var routes = function(server) {

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      var redisClient = request.server.plugins['hapi-redis'].client;
      var context = {};
      var flow = [];

      flow.push(function(flowCb) {
        Spaces.all(redisClient, function(err, spaces) {
          if (err) return flowCb(err);
          context.spaces = spaces;
          flowCb();
        });
      });

      flow.push(function(flowCb) {
        async.each(
          context.spaces,
          function(item, eachCb) {
            Datapoint.all(redisClient, item.name, function(err, members) {
              if (err) return eachCb(err);
              item.members = members;
              eachCb();
            })
          },
          flowCb
        );
      });

      async.series(flow, function(err) {
        if (err) return reply(err);
        server.render("index", context, {}, function(err, rendered) {
          if (err) return reply(err);
          reply(rendered);
        });  
      });
    }
});

// that last 100 values this data poin has had
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/history/{dataname}.json',
  handler: function(request, reply) {
    var redisClient = request.server.plugins['hapi-redis'].client;
    var limit = 100;
    var offset = 0;

    Datapoint.history(redisClient, request.params.spacename, request.params.dataname, offset, limit, function(err, datapoints) {
      if (err) {
        request.log.error(err);
        reply(404);
      } else {
        reply({
          "offset": offset,
          "limit": limit,
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
    Datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        request.log.error(err);
        reply(404);
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
    Datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        request.log.error(err);
        reply(404);
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
    Datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        request.log.error(err);
        reply(404);
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
    if (request.url.query.value === undefined) {
      request.log.error(err);
      return reply(403);
    }
    Datapoint.set(redisClient, request.params.spacename, request.params.dataname, request.url.query.value, function(err, data) {
      if (err) {
        request.log.error(err);
        reply(500);
      } else {
        reply({"status":"OK","result":data})
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
    Datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        request.log.error(err);
        reply(500);
      } else if (data === null) {
        request.log.error(err);
        reply(404);
      } else {
         server.render("data-widget", {data: data}, {}, function(err, rendered) {
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
    Datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        request.log.error(err);
        reply(404);
      } else {
        var renderContext = {
          data: data,
          space: {name: "vhs"}
        };
        server.render("data-full", renderContext, {}, function(err, rendered) {
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
    Datapoint.get(redisClient, request.params.spacename, request.params.dataname, function(err, data) {
      if (err) {
        request.log.error(err);
        reply(404);
      } else {
        server.render("data", {data: data}, {}, function(err, rendered) {
          if (err) return reply(err);
          reply(rendered);
        });
      }
    });
  }
});
}

module.exports = routes;
