'use strict';

const context = {
    sysconfig: {
        terafoundation: {
            log_level: 'debug'
        }
    },
    name: 'terafoundation'
};

// This sets up the API endpoints in the context.
require('../../lib/api')(context);

describe('getSystemEvents foundation API', () => {
    const foundation = context.apis.foundation;

    it('should return and event emitter', () => {
        expect(foundation.getSystemEvents().on).toBeDefined();
        expect(foundation.getSystemEvents().emit).toBeDefined();
    });

    it('should emit and receive events', () => {
        const spy = jasmine.createSpy('testevent');
        const events = foundation.getSystemEvents();

        events.on('testevent', spy);
        events.emit('testevent', 1);

        expect(spy).toHaveBeenCalledWith(1);
    });
});
