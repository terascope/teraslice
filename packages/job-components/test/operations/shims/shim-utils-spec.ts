import 'jest-extended';
import { convertResult } from '../../../src/operations/shims/shim-utils';
import { DataEntity } from '../../../src';

describe('Shim Utils', () => {
    describe('convertResult', () => {
        it('should handle an array of buffers', () => {
            const buf = Buffer.from('hello');
            const result = convertResult([buf]);

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toEqual(Buffer.from('hello'));
        });

        it('should handle an array of strings', () => {
            const str = 'hello';
            const result = convertResult([str]);

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toEqual(str);
        });

        it('should handle an array of DataEntities', () => {
            const data = new DataEntity({ hello: true });
            const result = convertResult([data]);

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toEqual(data);
        });

        it('should handle an array of Objects', () => {
            const data = { hello: true };
            const result = convertResult([data]);

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toEqual(data);
        });

        it('should handle an empty array', () => {
            const result = convertResult([]);
            expect(result).toBeArrayOfSize(0);
        });

        it('should handle an array with a null value', () => {
            // @ts-ignore
            const result = convertResult([null]);
            expect(result).toBeArrayOfSize(0);
        });
    });
});
