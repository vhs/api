'use strict';

const CryptoJS = require('crypto-js');
const axios = require('axios');
const debug = require('debug')('vhs-api:test');
const { getLine } = require('../utils');

const baseUrl = 'http://localhost:8000';
const clientName = 'test1';
const clientSecret = 'teststring';

describe('Test the test endpoint', () => {
  it('test the GET', async () => {
    const requestURI = '/s/test/data/test.json';

    const requestUrl = baseUrl + requestURI;

    const result = await axios.get(requestUrl);

    debug(getLine(), 'result:', result);

    const { data } = result;

    debug(getLine(), 'Response code: ' + result.status);
    debug(getLine(), '------------------------------------------');
    debug(getLine(), data.value);
    debug(getLine(), '------------------------------------------');
    debug(getLine(), result.headers);

    if (result.status === 200 && result.headers['content-type'].indexOf('application/json') === 0 && data.value !== 'undefined') {
      return true;
    }

    throw new Error(data);
  });

  it('test update with GET', async () => {
    const ts = Math.floor(Date.now() / 1000);

    const requestURI = '/s/test/data/test/update?value=update-' + ts;

    const key = ts + requestURI + clientSecret;

    const hash = CryptoJS.HmacSHA256(requestURI, key);

    const signedRequestUrl = baseUrl + requestURI + '&ts=' + ts + '&client=' + clientName + '&hash=' + hash;

    const httpResponse = await axios.get(signedRequestUrl);

    debug(getLine(), 'httpResponse:', httpResponse);

    const body = httpResponse.data;

    debug(getLine(), 'Response code: ' + httpResponse.status);
    debug(getLine(), '------------------------------------------');
    debug(getLine(), body.status);

    if (httpResponse.status === 200 && body.status === 'OK') {
      return true;
    }

    throw new Error(body);
  });

  it('test update with PUT', async () => {
    const ts = Math.floor(Date.now() / 1000);

    const requestURI = '/s/test/data/test/update?value=update-' + ts;

    const formdata = {};

    formdata.value = 'update-' + ts;
    formdata.ts = String(ts);
    formdata.client = clientName;

    const key = ts + JSON.stringify(formdata) + clientSecret;

    const hash = CryptoJS.HmacSHA256(JSON.stringify(formdata), key);

    const signedRequestUrl = baseUrl + requestURI + '&hash=' + hash;

    const httpResponse = await axios({
      method: 'put',
      url: signedRequestUrl,
      json: true,
      data: formdata,
    });

    const body = httpResponse.data;

    debug(getLine(), 'Response code: ' + httpResponse.status);
    debug(getLine(), '------------------------------------------');
    debug(getLine(), body.status);

    if (httpResponse.status === 200 && body.status === 'OK') {
      return true;
    }

    throw new Error(body);
  });
});
