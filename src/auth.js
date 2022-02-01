'use strict';

const CryptoJS = require('crypto-js');
const bunyan = require('bunyan');
const logger = bunyan.createLogger({ name: 'api', level: 'info' });
const config = require('./config.js');
const debug = require('debug')('vhs-api:auth');
const { getLine } = require('../utils');

const acls = config.get('acls');
const clients = config.get('clients');

const matchACL = function (requestPath) {
  if (acls[requestPath] !== undefined) {
    return true;
  }

  return false;
};

module.exports.matchACL = matchACL;

const verifyRequest = function (requestUrl, requestPath, clientName, timeStamp, request_hash) {
  debug(getLine(), 'verifyRequest', requestUrl);

  if ((parseInt(timeStamp) > (Math.floor(Date.now() / 1000) + 30)) || (parseInt(timeStamp) < (Math.floor(Date.now() / 1000) - 30))) {
    debug('timestamp out of window');
    logger.debug('timestamp out of window');

    return false;
  }

  if (clients[clientName] === undefined) {
    debug('invalid client: ' + clientName);
    logger.debug('invalid client: ' + clientName);

    return false;
  }

  if (acls[requestPath].indexOf(clientName) < 0) {
    debug('client not permitted: ' + clientName);
    logger.debug('client not permitted: ' + clientName);

    return false;
  }

  const key = timeStamp + requestUrl + clients[clientName].secret;

  const checked_hash = CryptoJS.HmacSHA256(requestUrl, key).toString();

  if (checked_hash !== request_hash) {
    debug('invalid HMAC: ' + request_hash);
    debug('invalid HMAC: ' + checked_hash);
    logger.debug('invalid HMAC: ' + request_hash + ' / ' + checked_hash);

    return false;
  }

  return true;
};

module.exports.verifyRequest = verifyRequest;
