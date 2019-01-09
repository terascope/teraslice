import 'jest-extended';
import * as index from '../src';

describe('index', () => {
    it('should export DataEntity', () => {
        expect(index.DataEntity).not.toBeNil();
    });

    it('should export Collector', () => {
        expect(index.Collector).not.toBeNil();
    });

    it('should export debugLogger', () => {
        expect(index.debugLogger).not.toBeNil();
    });
});
