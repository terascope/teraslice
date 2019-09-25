'use strict';

const { debugLogger } = require('@terascope/utils');
const workerModule = require('../lib/worker');

describe('worker', () => {
    it('should not throw when constructed', () => {
        const context = {
            logger: debugLogger('worker-module')
        };
        expect(() => workerModule(context)).not.toThrow();
    });
});
