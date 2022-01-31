'use strict';

const CryptoJS = require('crypto-js');
const axios = require('axios');
const debug = require('debug')('vhs-api:test');
const { getLine } = require('../utils');

const baseUrl = 'http://localhost:8000';

describe('Test the food data point', () => {
  it('test the GET', async () => {
    const requestURI = '/s/vhs/data/food.json';

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
    const requestURI = '/s/vhs/data/food/update?value=mild';

    const requestUrl = baseUrl + requestURI;

    const httpResponse = await axios.get(requestUrl);

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
    const requestURI = '/s/vhs/data/food/update?value=spicy';

    const requestUrl = baseUrl + requestURI;

    const httpResponse = await axios.put(requestUrl);

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
