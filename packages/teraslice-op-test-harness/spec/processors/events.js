'use strict';

const Promise = require('bluebird');
// Count the occurances of each event by name

function newProcessor(context, opConfig) {
    const events = context.foundation.getEventEmitter();
    let count = 0;
    events.on(opConfig.eventName, () => {
        count += 1;
    });
    return function process() {
        return Promise.delay(0).then(() => count);
    };
}

function schema() {
    return {
        eventName: {
            doc: 'Event name to aggregate for count.',
            format: String,
            default: null
        }
    };
}

module.exports = { newProcessor, schema };
