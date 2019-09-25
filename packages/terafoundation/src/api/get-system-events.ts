import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

module.exports = function getSystemEventsModule() {
    return () => eventEmitter;
};
