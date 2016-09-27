'use strict';

const _ = require('lodash');
const irc = require('irc');
const logger = require('../logger');

function create(client, params) {
  return _.assign({}, params, {
    client
  });
}

const connections = {};

function* connect(params) {
  const host = params.host;
  const nick = params.nick;

  return yield new Promise((fulfill, reject) => {
    try {
      const id = '0';
      const client = new irc.Client(host, nick, {
        channels: params.channels,
        autoConnect: false,
        showErrors: true,
        debug: true,
        encoding: 'UTF-8'
      });

      const conn = connections[id];
      if (conn) {
        logger.info('already connected...');
        fulfill(conn);
      } else {
        client.connect(5, function(details) {
          const additional = _.assign({}, details, params);
          const created = create(client, additional);
          connections[id] = created;
          fulfill(created);
        });
      }
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  connect
};
