import 'jest-extended';
import * as index from '../src/index.js';

describe('index', () => {
    it('should export evaluate', () => {
        expect(index.evaluate).toBeFunction();
    });

    it('should export transform', () => {
        expect(index.transform).toBeFunction();
    });

    it('should export parse', () => {
        expect(index.parse).toBeFunction();
    });
});
