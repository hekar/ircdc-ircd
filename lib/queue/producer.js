'use strict';

const bluebird = require('bluebird');
const config = require('../config');
const amqp = require('amqp');
const logger = require('../logger');

const connection = bluebird.promisifyAll(
  amqp.createConnection(config.rabbitmq)
);

connection.on('error', function(e) {
  logger.error('amqp: ', e);
});

function* connect() {
  yield connection.onAsync('ready');

  const name = 'from-ircd';
  const options = {
  };
  const exchange = bluebird.promisifyAll(yield connection.exchangeAsync(
    name, options));

  return {
    publish: function* (message) {
      console.log('gnu');
      const routingKey = '';
      const jsonMessage = JSON.stringify(message);
      const publishOptions = {
      };

      return yield exchange.publishAsync(
        routingKey, jsonMessage, publishOptions);
    }
  };
}

module.exports = {
  connect
};
