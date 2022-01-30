'use strict';

const CryptoJS = require('crypto-js');
const request = require('request-promise');
const debug = require('debug')('vhs-api:test');
const { getLine } = require('../utils');

const baseUrl = 'http://localhost:8080';
const clientName = 'test1';
const clientSecret = 'teststring';

describe('Do the tests', () => {
  it('test the GET', done => {
    const requestURI = '/s/test/data/test.json';

    const requestUrl = baseUrl + requestURI;

    request.get({
      url: requestUrl,
    }, (err, httpResponse, body) => {
      if (err) {
        debug(getLine(), err);
        console.log(typeof err);
        done(new Error(err));
      } else {
        if (typeof body !== 'object') {
          body = JSON.parse(body);
        }

        debug(getLine(), 'Response code: ' + httpResponse.statusCode);
        debug(getLine(), '------------------------------------------');
        debug(getLine(), body.value);
        debug(getLine(), '------------------------------------------');
        debug(getLine(), httpResponse.headers);

        if (httpResponse.statusCode === 200 && httpResponse.headers['content-type'].indexOf('application/json') === 0 && body.value !== 'undefined') {
          done();
        } else {
          done(new Error(body));
        }
      }
    });
  });

  it('test update with GET', done => {
    const ts = Math.floor(Date.now() / 1000);
    const requestURI = '/s/test/data/test/update?value=update-' + ts;

    const key = ts + requestURI + clientSecret;

    const hash = CryptoJS.HmacSHA256(requestURI, key);

    const signedRequestUrl = baseUrl + requestURI + '&ts=' + ts + '&client=' + clientName + '&hash=' + hash;

    request.get({
      url: signedRequestUrl,
    }, (err, httpResponse, body) => {
      if (err) {
        debug(getLine(), err);
        console.log(typeof err);
        done(new Error(err));
      } else {
        if (typeof body !== 'object') {
          body = JSON.parse(body);
        }

        debug(getLine(), 'Response code: ' + httpResponse.statusCode);
        debug(getLine(), '------------------------------------------');
        debug(getLine(), body.status);
        if (httpResponse.statusCode === 200 && body.status === 'OK') {
          done();
        } else {
          done(new Error(body));
        }
      }
    });
  });

  it('test update with PUT', done => {
    const ts = Math.floor(Date.now() / 1000);
    const requestURI = '/s/test/data/test/update';

    const formdata = {};
    formdata.value = 'update-' + ts;
    formdata.ts = String(ts);
    formdata.client = clientName;

    const key = ts + JSON.stringify(formdata) + clientSecret;

    const hash = CryptoJS.HmacSHA256(JSON.stringify(formdata), key);

    const signedRequestUrl = baseUrl + requestURI + '?hash=' + hash;

    request.put({
      url: signedRequestUrl,
      json: true,
      form: formdata,
    }, (err, httpResponse, body) => {
      if (err) {
        debug(getLine(), err);
        debug(typeof err);
        done(new Error(err));
      } else {
        debug(getLine(), 'Response code: ' + httpResponse.statusCode);
        debug(getLine(), '------------------------------------------');
        debug(getLine(), body.status);
        if (httpResponse.statusCode === 200 && body.status === 'OK') {
          done();
        } else {
          done(new Error(body));
        }
      }
    });
  });
});
