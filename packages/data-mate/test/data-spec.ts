import { times } from '@terascope/utils';
import 'jest-extended';
import { ReadableData, WritableData } from '../src/core';

describe('Data', () => {
    describe('when constructing with a size of 8', () => {
        const size = 8;
        let writable: WritableData<string>;
        let readable: ReadableData<string>;
        beforeEach(() => {
            writable = WritableData.make(size);
        });

        describe('when the values are all unique', () => {
            const values = Object.freeze(times(size, (n) => `a${n}`));
            beforeEach(() => {
                values.forEach((v, i) => writable.set(i, v));
                readable = new ReadableData(writable);
            });

            it('should have the correct indices', () => {
                const indices = Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8);
                expect(readable.indices).toStrictEqual(indices);
            });

            it('should have the correct values', () => {
                expect(readable.values).toStrictEqual([
                    { value: 'a0', indices: Array.of(0) },
                    { value: 'a1', indices: Array.of(1) },
                    { value: 'a2', indices: Array.of(2) },
                    { value: 'a3', indices: Array.of(3) },
                    { value: 'a4', indices: Array.of(4) },
                    { value: 'a5', indices: Array.of(5) },
                    { value: 'a6', indices: Array.of(6) },
                    { value: 'a7', indices: Array.of(7) }
                ]);
            });

            it('should have the correct distinct values', () => {
                expect(readable.distinct()).toEqual(size);
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

            it('should have the correct indices', () => {
                const indices = Uint8Array.of(1, 2, 1, 2, 1, 2, 1, 2);
                expect(readable.indices).toStrictEqual(indices);
            });

            it('should have the correct values', () => {
                expect(readable.values).toStrictEqual(
                    [
                        { value: 'a0', indices: Array.of(0, 2, 4, 6) },
                        { value: 'a1', indices: Array.of(1, 3, 5, 7) }
                    ],
                );
            });

            it('should have the correct distinct values', () => {
                expect(readable.distinct()).toEqual(2);
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

            it('should have the correct indices', () => {
                const indices = Uint8Array.of(1, 0, 2, 0, 3, 0, 4, 0);
                expect(readable.indices).toStrictEqual(indices);
            });

            it('should have the correct values', () => {
                expect(readable.values).toStrictEqual([
                    { value: 'a0', indices: Array.of(0) },
                    { value: 'a2', indices: Array.of(2) },
                    { value: 'a4', indices: Array.of(4) },
                    { value: 'a6', indices: Array.of(6) },
                ]);
            });

            it('should have the correct distinct values', () => {
                expect(readable.distinct()).toEqual(4);
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
        });

        describe('when there are only null values', () => {
            const values = Object.freeze(times(size, () => null));

            beforeEach(() => {
                values.forEach((v, i) => writable.set(i, v));
                readable = new ReadableData(writable);
            });

            it('should have the correct indices', () => {
                const indices = Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0);
                expect(readable.indices).toStrictEqual(indices);
            });

            it('should have the correct values', () => {
                expect(readable.values).toStrictEqual([]);
            });

            it('should have the correct distinct values', () => {
                expect(readable.distinct()).toEqual(0);
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
            writable = WritableData.make(size);
            values.forEach((v, i) => writable.set(i, v));
            readable = new ReadableData(writable);
        });

        it('should have the correct indices', () => {
            const indices = Uint8Array.of(1, 2, 3, 4, 0, 5, 6, 7);
            expect(readable.indices).toStrictEqual(indices);
        });

        it('should not be a primitive', () => {
            expect(readable.isPrimitive).toBeFalse();
        });

        it('should have the correct values', () => {
            expect(readable.values).toStrictEqual([
                { value: { a: 0 }, indices: Array.of(0) },
                { value: { a: 1 }, indices: Array.of(1) },
                { value: { a: 0 }, indices: Array.of(2) },
                { value: { a: 1 }, indices: Array.of(3) },
                { value: { a: 1 }, indices: Array.of(5) },
                { value: { a: 0 }, indices: Array.of(6) },
                { value: { a: 1 }, indices: Array.of(7) },
            ]);
        });

        it('should have the correct distinct values', () => {
            expect(readable.distinct()).toEqual(2);
        });

        it('should be able to get all of the values', () => {
            const result = times(size, (i) => readable.get(i));
            expect(result).toStrictEqual([...values]);
        });
    });
});
