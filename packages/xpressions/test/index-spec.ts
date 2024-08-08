import 'jest-extended';
import { evaluate, transform, parse } from '../src/index.js';

describe('index', () => {
    it('should export evaluate', () => {
        expect(evaluate).toBeFunction();
    });

    it('should export transform', () => {
        expect(transform).toBeFunction();
    });

    it('should export parse', () => {
        expect(parse).toBeFunction();
    });
});
