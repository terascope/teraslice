
'use strict';

const events = require('events');

const eventEmitter = new events.EventEmitter();

module.exports = function getSystemEventsModule() {
    return () => eventEmitter;
};
