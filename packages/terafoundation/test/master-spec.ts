import { EventEmitter } from 'events';
import { debugLogger } from '@terascope/utils';
import { jest } from '@jest/globals'
import masterModule from '../src/master.js';

describe('master', () => {
    const events = new EventEmitter();
    const cluster = new EventEmitter() as any;
    cluster.fork = jest.fn();

    const context = {
        sysconfig: {
            terafoundation: {
                workers: 0
            }
        },
        apis: {
            foundation: {
                getSystemEvents() {
                    return events;
                }
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
        expect(() => masterModule(context as any, moduleConfig as any)).not.toThrow();
    });
});
