'use strict';

const co = require('co');
const daemon = require('./daemon');

function* main() {
  yield daemon.start();
}

if (require.main === module) {
  co(main);
}
