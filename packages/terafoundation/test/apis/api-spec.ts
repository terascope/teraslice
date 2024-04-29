import 'jest-extended';
import api from '../../src/api';

describe('apis module', () => {
    const context = {
        sysconfig: {
            terafoundation: {
                log_level: 'debug'
            }
        },
        name: 'terafoundation'
    } as any;

    beforeEach(() => {
        // This sets up the API endpoints in the context.
        api(context);
    });

    it('context.apis.registerAPI should exist', () => {
        expect(context.apis.registerAPI).toBeDefined();
        expect(typeof context.apis.registerAPI).toBe('function');
    });

    it('context.apis.registerAPI should define a new API', () => {
        context.apis.registerAPI('testapi', {
            testfunction: () => { }
        });

        expect(context.apis.testapi).toBeDefined();
        expect(context.apis.testapi.testfunction).toBeDefined();
        expect(typeof context.apis.testapi.testfunction).toBe('function');
    });

    it('Should throw an exception if redefining an API', () => {
        context.apis.registerAPI('testapi', {
            testfunction: () => { }
        });
        expect(() => {
            context.apis.registerAPI('testapi', {
                testfunction: () => { }
            });
        }).toThrowError('Registration of API endpoints for module testapi can only occur once');
    });

    it('deprecated terafoundation api endpoints should exist', () => {
        expect(context.foundation.makeLogger).toBeDefined();
        expect(context.foundation.getEventEmitter).toBeDefined();
        expect(context.foundation.getConnection).toBeDefined();
        expect(context.foundation.startWorkers).toBeDefined();

        expect(typeof context.foundation.makeLogger).toBe('function');
        expect(typeof context.foundation.getEventEmitter).toBe('function');
        expect(typeof context.foundation.getConnection).toBe('function');
        expect(typeof context.foundation.startWorkers).toBe('function');
    });

    it('updated terafoundation api endpoints should exist', () => {
        expect(context.apis.foundation.makeLogger).toBeDefined();
        expect(context.apis.foundation.getSystemEvents).toBeDefined();
        expect(context.apis.foundation.getConnection).toBeDefined();
        expect(context.apis.foundation.startWorkers).toBeDefined();
        expect(context.apis.foundation.promMetrics.init).toBeDefined();

        expect(typeof context.apis.foundation.makeLogger).toBe('function');
        expect(typeof context.apis.foundation.getSystemEvents).toBe('function');
        expect(typeof context.apis.foundation.getConnection).toBe('function');
        expect(typeof context.apis.foundation.startWorkers).toBe('function');
        expect(typeof context.apis.foundation.promMetrics).toBe('object');
        expect(typeof context.apis.foundation.promMetrics.init).toBe('function');
    });

    it('terafoundation promMetricsApi endpoints should not yet exist', () => {
        expect(context.apis.foundation.promMetrics.api).toBeUndefined();
    });
});
