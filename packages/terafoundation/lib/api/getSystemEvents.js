
'use strict';

const events = require('events');

const eventEmitter = new events.EventEmitter();

module.exports = function module() {
    return () => eventEmitter;
};
