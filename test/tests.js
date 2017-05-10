"use strict";

var CryptoJS = require("crypto-js");
var request = require('request-promise');
var debug = require('debug')('vhs-api:test');
var getLine = require('../utils').getLine;

var baseUrl = "http://localhost:8080";
var clientName = "test1";
var clientSecret = "teststring";

describe('Do the tests', function(){

    it( "test the GET", function( done ) {
    	var requestURI = "/s/test/data/test.json";
    	
		var requestUrl = baseUrl + requestURI;
    	
    	request.get({
    		url : requestUrl
    	}, function( err, httpResponse, body ) {
    		if( err ) {
    			debug( getLine(), err );
    			console.log( typeof err );
    			done( new Error( err ) );
    		} else {
    			if( typeof body != 'object' )
    				body = JSON.parse( body );
    			debug( getLine(), "Response code: " + httpResponse.statusCode );
    			debug( getLine(), "------------------------------------------" );
    			debug( getLine(), body.value );
    			debug( getLine(), "------------------------------------------" );
    			debug( getLine(), httpResponse.headers );
    			if( httpResponse.statusCode == 200 && httpResponse.headers['content-type'].indexOf( 'application/json' ) === 0 && body.value !== 'undefined' ) {
    				done();
    			} else {
    				done( new Error( body ) );
    			}
    		}
    		
    	});
    });

    it( "test update with GET", function( done ) {
    	var ts = Math.floor(Date.now()/1000);
    	var requestURI = "/s/test/data/test/update?value=update-" + ts;
    	
    	var key = ts + requestURI + clientSecret;
		
		var hash = CryptoJS.HmacSHA256( requestURI, key );
		
		var signedRequestUrl = baseUrl + requestURI + "&ts=" + ts + "&client=" + clientName + "&hash=" + hash;
    	
    	request.get({
    		url : signedRequestUrl
    	}, function( err, httpResponse, body ) {
    		if( err ) {
    			debug( getLine(), err );
    			console.log( typeof err );
    			done( new Error( err ) );
    		} else {
    			if( typeof body != 'object' )
    				body = JSON.parse( body );
    			debug( getLine(), "Response code: " + httpResponse.statusCode );
    			debug( getLine(), "------------------------------------------" );
    			debug( getLine(), body.status );
    			if( httpResponse.statusCode == 200 && body.status == 'OK' ) {
    				done();
    			} else {
    				done( new Error( body ) );
    			}
    		}
    		
    	});
    });
    
    it( "test update with PUT", function( done ) {
    	var ts = Math.floor(Date.now()/1000);
    	var requestURI = "/s/test/data/test/update";
    	
    	var formdata = {};
    	formdata.value = "update-" + ts;
    	formdata.ts =  ""+ts;
    	formdata.client = clientName;
    	
    	var key = ts + JSON.stringify( formdata ) + clientSecret;
    	
    	var hash = CryptoJS.HmacSHA256( JSON.stringify( formdata ), key );
    	
    	var signedRequestUrl = baseUrl + requestURI + "?hash=" + hash;
    	
    	request.put({
    		url : signedRequestUrl,
    		json: true,
    		form: formdata
    	}, function( err, httpResponse, body ) {
    		if( err ) {
    			debug( getLine(), err );
    			debug( typeof err );
    			done( new Error( err ) );
    		} else {
    			debug( getLine(), "Response code: " + httpResponse.statusCode );
    			debug( getLine(), "------------------------------------------" );
    			debug( getLine(), body.status );
    			if( httpResponse.statusCode == 200 && body.status == 'OK' ) {
    				done();
    			} else {
    				done( new Error( body ) );
    			}
    		}
    		
    	});
    });

});
