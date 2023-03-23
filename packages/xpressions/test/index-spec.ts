import { expectTypeOf } from 'vitest';
import * as index from '../src';

describe('index', () => {
    it('should export evaluate', () => {
        expectTypeOf(index.evaluate).toBeFunction();
    });

    it('should export transform', () => {
        expectTypeOf(index.transform).toBeFunction();
    });

    it('should export parse', () => {
        expectTypeOf(index.parse).toBeFunction();
    });
});
