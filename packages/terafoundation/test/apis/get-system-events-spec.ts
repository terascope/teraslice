import 'jest-extended';
import api from '../../src/api.js';

describe('getSystemEvents foundation API', () => {
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

    it('should return and event emitter', () => {
        const { foundation } = context.apis;
        expect(foundation.getSystemEvents().on).toBeDefined();
        expect(foundation.getSystemEvents().emit).toBeDefined();
    });

    it('should emit and receive events', () => {
        const { foundation } = context.apis;
        const spy = jest.fn();
        const events = foundation.getSystemEvents();

        events.on('testevent', spy);
        events.emit('testevent', 1);

        expect(spy).toHaveBeenCalledWith(1);
    });
});
