"use strict";

var Datastore = require('./datastore');
var debug = require('debug')('vhs-api:routes');

var conf = require('./config.js');

var auth = require('./auth');

var routes = function(server) {
	
server.route( {
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
    	var influx = request.server.plugins.influx.influx;
    	new Datastore(influx).getSummary()
    	.then( function( summary ) {
    		var context = {
    			spaces: summary
    		};
    		server.render( "index", context, {}, function( err, rendered ) {
                if (err) return reply(err);
                reply(rendered);
            });
    	}).catch( function( err ) {
          reply(err);
        });
    }
} );

// that last 100 values this data poin has had
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/history/{dataname}.json',
  handler: function( request, reply ) {
		var limit = 100;
		var offset = 0;

		if( request.query.offset !== undefined && typeof parseInt( request.query.offset ) == 'number' ) {
			offset = parseInt( request.query.offset );
		}

		if( request.query.limit !== undefined && typeof parseInt( request.query.limit ) == 'number' ) {
			limit = parseInt( request.query.limit );
		}

		var influx = request.server.plugins.influx.influx;
		new Datastore( influx ).getHistory( request.params.spacename, request.params.dataname, offset, limit )
		.then( function( data ) {
			if( data ) {
				data.forEach( function( i ) {
					i.last_updated = Math.round( Date.parse( i.last_updated ) / 1000 );
				});
			}
			reply( {
				"offset": offset,
				"limit": limit,
				"count": data.length,
				"data": data
			}).header( 'Content-Type', 'application/json' );
		})
		.catch( function( err ) {
			request.log.error( err );
			reply( "error" ).code( 404 );
		});
	}
});

// the latest value of this data point
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}.json',
  handler: function( request, reply ) {
	    var influx = request.server.plugins.influx.influx;
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
    var influx = request.server.plugins.influx.influx;
    new Datastore(influx).getLatest(request.params.spacename, request.params.dataname)
        .then(function(result){
          reply(result.value).header('Content-Type', "text/plain");
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

// Update value
// /s/vhs/data/isopen/update?value=closed
server.route({
	method: 'PUT',
	path: '/s/{spacename}/data/{dataname}/update',
	handler: function( request, reply ) {
		// Check input
		if (request.payload.value === undefined) {
			request.log.error("Missing value argument");
			return reply('Forbidden - Missing value argument').code(400);
		}
		
		// Check auth
		if( auth.matchACL( request.url.pathname ) ) {
			
			if( ( request.payload.client === undefined ) || ( request.payload.ts === undefined ) || ( request.url.query.hash === undefined ) ) {
				request.log.error("Missing authorization fields");
				return reply('Not Authorized - Missing authorization fields').code(401);
			}
			
			var verified = auth.verifyRequest( JSON.stringify( request.payload ), request.url.pathname, request.payload.client, request.payload.ts, request.url.query.hash );
			
			if( ! verified ) {
				request.log.error( "failed HMAC for:" );
				request.log.error( request.url );
				return reply('Not Authorized - Failed Authentication').code(403);
			}
		}
		
		let influx = request.server.plugins.influx.influx;
		
		var ds = new Datastore(influx);
		
		ds.setIfChanged(request.params.spacename, request.params.dataname, request.payload.value)
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

// Keep GET method for backward compatibility for now
//
server.route({
	method: 'GET',
	path: '/s/{spacename}/data/{dataname}/update',
	handler: function(request, reply) {
		// Check for valid input
		if (request.url.query.value === undefined) {
			request.log.error("Missing value argument");
			return reply('Forbidden - Missing value argument').code(400);
		}
		// Check auth
		if( auth.matchACL( request.url.pathname ) ) {
			
			if( ( request.url.query.client === undefined ) || ( request.url.query.ts === undefined ) || ( request.url.query.hash === undefined ) ) {
				request.log.error("Missing authorization fields");
				return reply('Not Authorized - Missing authorization fields').code(401);
			}
			
			let requestUrl = request.url.pathname + "?value=" + request.url.query.value;
				
			var verified = auth.verifyRequest( requestUrl, request.url.pathname, request.url.query.client, request.url.query.ts, request.url.query.hash );
			
			if( ! verified ) {
				request.log.error( "failed HMAC for:" );
				request.log.error( request.url );
				return reply('Not Authorized - Failed Authentication').code(403);
			}
		}
		let influx = request.server.plugins.influx.influx;
		var ds = new Datastore(influx);
		ds.setIfChanged(request.params.spacename, request.params.dataname, request.url.query.value)
		.then(function(result){
			result.last_updated = Math.round(Date.parse(result.last_updated)/1000);
			reply({"result":result, "status":"OK"});
		})
		.catch(function(err){
			request.log.error(err);
			reply('Error in query').code(500);
		});
	}
});

// returns a jquery snippet that will set the contents of an element with id
// #<spacename>-<dataname> to the value
server.route({
  method: 'GET',
  path: '/s/{spacename}/data/{dataname}.js',
  handler: function(request, reply) {
    var influx = request.server.plugins.influx.influx;
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
    var influx = request.server.plugins.influx.influx;
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
    var influx = request.server.plugins.influx.influx;
    var first, second;
    var ds = new Datastore(influx);
    ds.getLatest(request.params.spacename, request.params.dataname1)
        .then(function(data){
          first = data;
          return ds.getLatest(request.params.spacename, request.params.dataname2);
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
    var influx = request.server.plugins.influx.influx;
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
