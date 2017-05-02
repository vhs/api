"use strict";

var CryptoJS = require('crypto-js');
var bunyan = require('bunyan');
var logger = bunyan.createLogger({name: 'api', level: 'info'});
var config = require('./config.js');
var debug = require('debug')('vhs-api:auth');
var getLine = require('../utils').getLine;

var acls = config.get('acls');
var clients = config.get('clients');

var matchACL = function( requestPath ) {
	if( acls[requestPath] !== undefined )
		return true;
	return false;
};

module.exports.matchACL = matchACL;

var verifyRequest = function( requestUrl, requestPath, clientName, timeStamp, request_hash ) {
	debug( getLine(), "verifyRequest", requestUrl );
	
	if( ( parseInt( timeStamp ) > ( Math.floor( Date.now() / 1000 ) + 30 ) ) || ( parseInt( timeStamp ) < ( Math.floor( Date.now() / 1000 ) - 30 ) ) ) {
		debug( "timestamp out of window" );
		return false;
	}
	
	if( clients[clientName] === undefined ) {
		debug( "invalid client: " + clientName );
		return false;
	}
	
	if( acls[requestPath].indexOf( clientName ) < 0 ) {
		debug( "client not permitted: " + clientName );
		return false;
	}
	
	let key = timeStamp + requestUrl + clients[clientName].secret;
	
	let checked_hash = CryptoJS.HmacSHA256( requestUrl, key ).toString();
	
	if( checked_hash != request_hash ) {
		debug( "invalid HMAC: " + request_hash );
		debug( "invalid HMAC: " + checked_hash );
		return false;
	}
	
	return true;
};

module.exports.verifyRequest = verifyRequest;