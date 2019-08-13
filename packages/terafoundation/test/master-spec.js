'use strict';

const { EventEmitter } = require('events');
const { debugLogger } = require('@terascope/utils');
const masterModule = require('../lib/master');

describe('master', () => {
    const events = new EventEmitter();
    const cluster = new EventEmitter();
    cluster.fork = jest.fn();

    const context = {
        sysconfig: {
            terafoundation: {
                workers: 0
            }
        },
        foundation: {
            getEventEmitter() {
                return events;
            }
        },
        cluster,
        logger: debugLogger('master-module')
    };

    const moduleConfig = {
        start_workers: false
    };

    afterAll(() => {
        events.removeAllListeners();
        cluster.removeAllListeners();
    });

    it('should throw when constructed', () => {
        expect(() => masterModule(context, moduleConfig)).not.toThrow();
    });
});
