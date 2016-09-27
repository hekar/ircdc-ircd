'use strict';

const _ = require('lodash');
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

function* subscribe(callback) {
  yield connection.onAsync('ready');

  connection.queue('to-ircd', (queue) => {
    queue.bind('#');
    queue.subscribe(_.partial(callback, queue));
  });
}

module.exports = {
  subscribe
};
