import 'jest-extended';
import { DataEntity, DataWindow } from '@terascope/utils';
import { convertResult } from '../../../src/operations/shims/shim-utils';

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

        it('should handle an array of arrays', () => {
            const arr = ['hello'];
            const result = convertResult([arr]);

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toEqual(arr);
        });

        it('should handle an array of DataEntities', () => {
            const data = new DataEntity({ hello: true });
            const result = convertResult([data]);

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toEqual(data);
        });

        it('should handle preserve a DataWindow', () => {
            const window = DataWindow.make([{ hello: true }]);
            const result = convertResult(window);

            expect(result).toBeInstanceOf(DataWindow);
            expect(result).toBe(window);
            expect(result).toEqual([
                {
                    hello: true
                }
            ]);
        });

        it('should handle preserve an array of DataWindows', () => {
            const window = DataWindow.make([{ hello: true }, { hi: true }]);
            const result = convertResult([window]);

            expect(DataWindow.isArray(result)).toBeTrue();
            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toBeArrayOfSize(2);
            expect(result[0]).toBe(window);
            expect(result[0]).toEqual([
                {
                    hello: true
                },
                {
                    hi: true
                }
            ]);
        });

        it('should handle a single DataEntity', () => {
            const data = new DataEntity({ hello: true });
            const result = convertResult(data);

            expect(result).toBeArrayOfSize(1);
            expect(result[0]).toEqual(data);
        });

        it('should handle an array of Objects', () => {
            const data = { hello: true };
            const result = convertResult([data, data, null]);

            expect(result).toBeArrayOfSize(3);
            expect(result[0]).toEqual(data);
            expect(result[1]).toEqual(data);
            expect(result[2]).toEqual({});
        });

        it('should handle null', () => {
            const result = convertResult(null);
            expect(result).toBeArrayOfSize(0);
        });

        it('should handle undefined', () => {
            const result = convertResult(undefined);
            expect(result).toBeArrayOfSize(0);
        });

        it('should handle an empty array', () => {
            const result = convertResult([]);
            expect(result).toBeArrayOfSize(0);
        });

        it('should handle an array with a null value', () => {
            const result = convertResult([null]);
            expect(result).toBeArrayOfSize(0);
        });
    });
});
