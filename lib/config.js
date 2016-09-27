'use strict';

const rc = require('rc');

module.exports = rc('ircdc_ircd', {
  rabbitmq: {
    host: 'localhost',
    port: 5672,
    login: 'admin',
    password: 'admin',
    vhost: '/'
  }
});
