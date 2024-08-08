import 'jest-extended';
import * as index from '../src/index.js';

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

    it('should export TSError', () => {
        expect(index.TSError).not.toBeNil();

        const defaultErr = new index.TSError('hello');

        expect(defaultErr).toHaveProperty('message', 'hello');
        expect(defaultErr).toHaveProperty('statusCode', 500);
        expect(defaultErr).toHaveProperty('fatalError', false);

        const customErr = new index.TSError('howdy', {
            statusCode: 502,
            fatalError: true,
        });

        expect(customErr).toHaveProperty('message', 'howdy');
        expect(customErr).toHaveProperty('statusCode', 502);
        expect(customErr).toHaveProperty('fatalError', true);
    });
});
