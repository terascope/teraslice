import { isNotNil, times } from '@terascope/core-utils';
import 'jest-extended';
import { ReadableData, WritableData } from '../src/core/index.js';

describe('Data', () => {
    describe('when constructing with a size of 8', () => {
        const size = 8;
        let writable: WritableData<string>;
        let readable: ReadableData<string>;
        beforeEach(() => {
            writable = new WritableData(size);
        });

        describe('when the values are all unique', () => {
            const values = Object.freeze(times(size, (n) => `a${n}`));
            beforeEach(() => {
                values.forEach((v, i) => writable.set(i, v));
                readable = new ReadableData(writable);
            });

            it('should have the correct values', () => {
                expect(Array.from(readable.values())).toStrictEqual(values.filter(isNotNil));
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => readable.get(i));
                expect(result).toStrictEqual([...values]);
            });
        });

        describe('when the values are NOT all unique', () => {
            const values = Object.freeze(times(size, (n) => `a${n % 2}`));

            beforeEach(() => {
                values.forEach((v, i) => writable.set(i, v));
                readable = new ReadableData(writable);
            });

            it('should have the correct values', () => {
                expect(Array.from(readable.values())).toStrictEqual(values.filter(isNotNil));
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => readable.get(i));
                expect(result).toStrictEqual([...values]);
            });
        });

        describe('when there are null values', () => {
            const values = Object.freeze(times(size, (n) => (
                n % 2 ? null : `a${n}`
            )));

            beforeEach(() => {
                values.forEach((v, i) => writable.set(i, v));
                readable = new ReadableData(writable);
            });

            it('should be a primitive', () => {
                expect(readable.isPrimitive).toBeTrue();
            });

            it('should have the correct values', () => {
                expect(Array.from(readable.values())).toStrictEqual(values.filter(isNotNil));
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => readable.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to slice the data', () => {
                const sliced = readable.slice();

                expect(sliced).toBeInstanceOf(WritableData);

                const data = new ReadableData(sliced);
                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to fork the data', () => {
                const sliced = readable.toWritable(readable.size + 1);

                expect(sliced).toBeInstanceOf(WritableData);

                const data = new ReadableData(sliced);
                const result = times(size + 1, (i) => data.get(i));
                expect(result).toStrictEqual([...values, null]);
            });

            it('should be able to resize the data (decrease)', () => {
                const sliced = readable.toWritable(2);

                expect(sliced).toBeInstanceOf(WritableData);
                expect(sliced.size).toBe(2);

                const data = new ReadableData(sliced);
                const result = times(2, (i) => data.get(i) ?? null);
                expect(result).toStrictEqual(values.slice(0, 2));
            });

            it('should be able to resize the data (increase)', () => {
                const sliced = readable.toWritable(size + 2);

                expect(sliced).toBeInstanceOf(WritableData);
                expect(sliced.size).toBe(size + 2);

                const data = new ReadableData(sliced);
                const result = times(10, (i) => data.get(i) ?? null);
                expect(result).toStrictEqual(
                    [...values].concat(null, null)
                );
            });
        });

        describe('when there are only null values', () => {
            const values = Object.freeze(times(size, () => null));

            beforeEach(() => {
                values.forEach((v, i) => writable.set(i, v));
                readable = new ReadableData(writable);
            });

            it('should be a primitive', () => {
                expect(readable.isPrimitive).toBeTrue();
            });

            it('should have the correct values', () => {
                expect(Array.from(readable.values())).toStrictEqual(values.filter(isNotNil));
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => readable.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to slice the data', () => {
                const sliced = readable.slice();

                expect(sliced).toBeInstanceOf(WritableData);

                const data = new ReadableData(sliced);
                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to resize the data', () => {
                const sliced = readable.toWritable(2);

                expect(sliced).toBeInstanceOf(WritableData);

                const data = new ReadableData(sliced);
                const result = times(2, (i) => data.get(i));
                expect(result).toStrictEqual(values.slice(0, 2));
            });
        });
    });

    describe('when dealing with non-primitive values', () => {
        const size = 8;
        const values = Object.freeze(times(size, (n) => (
            n === 4 ? null : { a: n % 2 }
        )));

        type TestObj = { a: number };
        let writable: WritableData<TestObj>;
        let readable: ReadableData<TestObj>;
        beforeEach(() => {
            writable = new WritableData(size);
            values.forEach((v, i) => writable.set(i, v));
            readable = new ReadableData(writable);
        });

        it('should not be a primitive', () => {
            expect(readable.isPrimitive).toBeFalse();
        });

        it('should have the correct values', () => {
            expect(Array.from(readable.values())).toStrictEqual(values.filter(isNotNil));
        });

        it('should be able to get all of the values', () => {
            const result = times(size, (i) => readable.get(i));
            expect(result).toStrictEqual([...values]);
        });
    });
});
