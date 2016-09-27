'use strict';

const co = require('co');
const logger = require('../logger');
const session = require('../session');
const queue = require('../queue');

const sessions = [];

function start() {

  queue.consumer().subscribe((message) => {
    console.log(message);
  });

  queue.producer().publish({
    message: 'hello'
  });

  const sessionMessages = [];
  function archiveMessage(msg) {
    sessionMessages.push(msg);
  }

  function sendPayload(type, data) {
    const upperType = (type) ? type.toUpperCase() : '';
    if (!upperType) {
      logger.warn('Missing type on payload');
      return;
    } else if (upperType === 'PING' ||
               upperType === 'PONG') {
      return;
    }

    try {
      const msg = JSON.stringify({
        type,
        payload: data
      });
      archiveMessage(msg);
      logger.info('sending message', msg);
      // TODO: send all
    } catch (e) {
      logger.error('Failure sending payload', e);
    }
  }

  co(function* () {
    const ircSession = yield session.connect({
      host: 'localhost',
      nick: 'hekar',
      channels: ['#general']
    });

    sessions.push(ircSession);

    // TODO: listen to sockjs updates
    // sock.listenAll('connection', () => {
    //   sessionMessages.archivedMessages.forEach((message) => {
    //     sendPayload(message.type, message.payload);
    //   });
    // });

    const client = ircSession.client;

    client.addListener('registered', function(message) {
      sendPayload('registered', message);
    });

    client.addListener('motd', function(motd) {
      sendPayload('motd', { motd });
    });

    client.addListener('names', function(channel, nicks) {
      sendPayload('names', { channel, nicks });
    });

    client.addListener('topic', function(channel, topic, nick, message) {
      sendPayload('topic', { channel, topic, nick, message });
    });

    client.addListener('join', function(channel, nick, message) {
      sendPayload('join', { channel, nick, message });
    });

    client.addListener('part', function(channel, nick, reason, message) {
      sendPayload('part', { channel, nick, reason, message });
    });

    client.addListener('quit', function(nick, reason, channels, message) {
      sendPayload('quit', { nick, reason, channels, message });
    });

    client.addListener('kick', function(channel, nick, by, reason, message) {
      sendPayload('kick', { channel, nick, by, reason, message });
    });

    client.addListener('kill', function(nick, reason, channels, message) {
      sendPayload('kill', { nick, reason, channels, message });
    });

    client.addListener('message', function(from, to, message) {
      console.log('message', message, from, to);
      sendPayload('message', { from, to, message });
    });

    client.addListener('selfMessage', function(to, text) {
      sendPayload('selfMessage', { to, text });
    });

    client.addListener('notice', function(nick, to, text, message) {
      sendPayload('notice', { nick, to, text, message });
    });

    client.addListener('ping', function(server) { //eslint-disable-line no-unused-vars
      // Ignore...
      //sendPayload('ping', { server });
    });

    client.addListener('pm', function(nick, text, message) {
      sendPayload('pm', { nick, text, message });
    });

    client.addListener('ctcp', function(from, to, text, type, message) {
      sendPayload('ctcp', { from, to, text, type, message });
    });

    client.addListener('ctcp-notice', function(from, to, text, message) {
      sendPayload('ctcp-notice', { from, to, text, message });
    });

    client.addListener('ctcp-privmsg', function(from, to, text, message) {
      sendPayload('ctcp-privmsg', { from, to, text, message });
    });

    client.addListener('ctcp-version', function(from, to, message) {
      sendPayload('ctcp-version', { from, to, message });
    });

    client.addListener('nick', function(oldnick, newnick, channels, message) {
      sendPayload('nick', { oldnick, newnick, channels, message });
    });

    client.addListener('invite', function(channel, from, message) {
      sendPayload('invite', { channel, from, message });
    });

    client.addListener('+mode', function(channel, by, mode, argument, message) {
      sendPayload('+mode', { channel, by, mode, argument, message });
    });

    client.addListener('-mode', function(channel, by, mode, argument, message) {
      sendPayload('-mode', { channel, by, mode, argument, message });
    });

    client.addListener('whois', function(info) {
      sendPayload('whois', { info });
    });

    client.addListener('channellist_start', function() {
      sendPayload('channellist_start');
    });

    client.addListener('channellist_item', function(message) {
      sendPayload('channellist_item', message);
    });

    client.addListener('channellist', function(message) {
      sendPayload('channellist', message);
    });

    client.addListener('raw', function(message) {
      sendPayload('raw', message);
    });

    client.addListener('error', function(message) {
      logger.error('error: ', message);
      sendPayload('error', message);
    });

    client.addListener('action', function(from, to, text, message) {
      sendPayload('action', { from, to, text, message });
    });

    client.addListener('normal', function(message) {
      sendPayload('normal', message);
    });

    client.addListener('reply', function(message) {
      sendPayload('reply', message);
    });
  }).catch((err) => {
    logger.error(err, 'Failure to connect to IRC server');
  });
}

process.stdin.resume();

function exitHandler(options, err) {
  // TODO: This function is a disaster
  // Maybe wait until all connections are closed
  // before exiting the application?

  if (err) {
    logger.error(err);
  }

  // HACK: nice try... but this doesn't work
  sessions.forEach((openSession) => {
      logger.info('disconnecting from session');
      openSession.client.disconnect('', function() {
        logger.info('successfully disconnected');
      });
  });

  if (options.cleanup) {
    logger.info('clean');
  }

  if (options.exit) {
    // HACK: Fix this... Ehhh???
    setTimeout(process.exit, 1500);
  }
}

// Do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// Catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// Catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

module.exports = {
  start
};
