import 'jest-extended';
import { debugLogger } from '@terascope/core-utils';
import workerModule from '../src/worker.js';

describe('worker', () => {
    it('should not throw when constructed', () => {
        const context: any = {
            logger: debugLogger('worker-module')
        };
        expect(() => workerModule(context)).not.toThrow();
    });
});
