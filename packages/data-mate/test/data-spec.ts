import { times } from '@terascope/utils';
import 'jest-extended';
import { Data } from '../src/core-utils/Data';

describe('Data', () => {
    describe('when constructing with a size of 8', () => {
        const size = 8;
        let data: Data<string>;
        beforeEach(() => {
            data = new Data(size);
        });

        describe('when the values are all unique', () => {
            const values = Object.freeze(times(size, (n) => `a${n}`));
            beforeEach(() => {
                values.forEach((v, i) => data.set(i, v));
            });

            it('should not be able to write after frozen', () => {
                data.freeze();
                expect(data.isFrozen).toBeTrue();
                expect(() => {
                    data.set(2, 'fail');
                }).toThrowError();
            });

            it('should have the correct indices', () => {
                expect(data.indices).toStrictEqual(
                    Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8)
                );
            });

            it('should have the correct values', () => {
                expect(data.values).toStrictEqual(
                    ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7']
                );
            });

            it('should have the correct nulls', () => {
                expect(data.nulls).toEqual(0);
            });

            it('should have the correct distinct values', () => {
                expect(data.distinct()).toEqual(size);
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });
        });

        describe('when the values are NOT all unique', () => {
            const values = Object.freeze(times(size, (n) => `a${n % 2}`));

            beforeEach(() => {
                values.forEach((v, i) => data.set(i, v));
            });

            it('should have the correct indices', () => {
                expect(data.indices).toStrictEqual(
                    Uint8Array.of(1, 2, 1, 2, 1, 2, 1, 2)
                );
            });

            it('should have the correct values', () => {
                expect(data.values).toStrictEqual(
                    ['a0', 'a1']
                );
            });

            it('should have the correct nulls', () => {
                expect(data.nulls).toEqual(0);
            });

            it('should have the correct distinct values', () => {
                expect(data.distinct()).toEqual(2);
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to get the associations', () => {
                expect([...data.associations()]).toStrictEqual([
                    ['a0', [0, 2, 4, 6]],
                    ['a1', [1, 3, 5, 7]],
                ]);
            });
        });

        describe('when there are null values', () => {
            const values = Object.freeze(times(size, (n) => (
                n % 2 ? null : `a${n}`
            )));

            beforeEach(() => {
                values.forEach((v, i) => data.set(i, v));
            });

            it('should have the correct indices', () => {
                expect(data.indices).toStrictEqual(
                    Uint8Array.of(1, 0, 2, 0, 3, 0, 4, 0)
                );
            });

            it('should have the correct values', () => {
                expect(data.values).toStrictEqual(
                    ['a0', 'a2', 'a4', 'a6']
                );
            });

            it('should have the correct nulls', () => {
                expect(data.nulls).toEqual(4);
            });

            it('should have the correct distinct values', () => {
                expect(data.distinct()).toEqual(4);
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to slice the data', () => {
                const sliced = data.freeze().slice();

                expect(sliced.isFrozen).toBeFalse();
                expect(Object.isFrozen(sliced)).toBeFalse();

                expect(sliced.isNaturallyDistinct).toEqual(data.isNaturallyDistinct);
                expect(sliced.nulls).toEqual(data.nulls);

                expect(sliced).not.toBe(data);

                expect(sliced.indices).toStrictEqual(data.indices);
                expect(sliced.indices).not.toBe(data.indices);

                expect(sliced.values).toStrictEqual(data.values);
                expect(sliced.values).not.toBe(data.values);

                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to fork the data', () => {
                const sliced = data.freeze().fork(data.size);

                expect(sliced.isFrozen).toBeFalse();
                expect(Object.isFrozen(sliced)).toBeFalse();

                expect(sliced.isNaturallyDistinct).toEqual(data.isNaturallyDistinct);
                expect(sliced.nulls).toEqual(data.nulls);

                expect(sliced).not.toBe(data);

                expect(sliced.indices).toStrictEqual(data.indices);
                expect(sliced.indices).not.toBe(data.indices);

                expect(sliced.values).toStrictEqual(data.values);
                expect(sliced.values).not.toBe(data.values);

                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to get the associations', () => {
                expect([...data.associations()]).toStrictEqual([
                    ['a0', [0]],
                    ['a2', [2]],
                    ['a4', [4]],
                    ['a6', [6]],
                    [null, [1, 3, 5, 7]],
                ]);
            });
        });

        describe('when there are only null values', () => {
            const values = Object.freeze(times(size, () => null));

            beforeEach(() => {
                values.forEach((v, i) => data.set(i, v));
            });

            it('should have the correct indices', () => {
                expect(data.indices).toStrictEqual(
                    Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 0)
                );
            });

            it('should have the correct values', () => {
                expect(data.values).toStrictEqual([]);
            });

            it('should have the correct nulls', () => {
                expect(data.nulls).toEqual(size);
            });

            it('should have the correct distinct values', () => {
                expect(data.distinct()).toEqual(0);
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to slice the data', () => {
                const sliced = data.freeze().slice();

                expect(sliced.isFrozen).toBeFalse();
                expect(Object.isFrozen(sliced)).toBeFalse();

                expect(sliced.isNaturallyDistinct).toEqual(data.isNaturallyDistinct);
                expect(sliced.nulls).toEqual(data.nulls);

                expect(sliced).not.toBe(data);

                expect(sliced.indices).toStrictEqual(data.indices);
                expect(sliced.indices).not.toBe(data.indices);

                expect(sliced.values).toStrictEqual(data.values);
                expect(sliced.values).not.toBe(data.values);

                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to fork the data', () => {
                const sliced = data.freeze().fork(data.size);

                expect(sliced.isFrozen).toBeFalse();
                expect(Object.isFrozen(sliced)).toBeFalse();

                expect(sliced.isNaturallyDistinct).toEqual(data.isNaturallyDistinct);
                expect(sliced.nulls).toEqual(data.nulls);

                expect(sliced).not.toBe(data);

                expect(sliced.indices).toStrictEqual(data.indices);
                expect(sliced.indices).not.toBe(data.indices);

                expect(sliced.values).toStrictEqual(data.values);
                expect(sliced.values).not.toBe(data.values);

                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });

            it('should be able to get the associations', () => {
                expect([...data.associations()]).toStrictEqual([
                    [null, [0, 1, 2, 3, 4, 5, 6, 7]],
                ]);
            });
        });
    });

    describe('when dealing with non-primitive values', () => {
        const size = 8;
        const values = Object.freeze(times(size, (n) => (
            n === 4 ? null : { a: n % 2 }
        )));

        type TestObj = { a: number };
        let data: Data<TestObj>;
        beforeEach(() => {
            data = new Data(size);
            data.isNaturallyDistinct = false;
            values.forEach((v, i) => data.set(i, v));
        });

        it('should have the correct indices', () => {
            expect(data.indices).toStrictEqual(
                Uint8Array.of(1, 2, 3, 4, 0, 5, 6, 7)
            );
        });

        it('should have the correct values', () => {
            expect(data.values).toStrictEqual(
                [{ a: 0 }, { a: 1 }, { a: 0 }, { a: 1 }, { a: 1 }, { a: 0 }, { a: 1 }]
            );
        });

        it('should have the correct nulls', () => {
            expect(data.nulls).toEqual(1);
        });

        it('should have the correct distinct values', () => {
            expect(data.distinct()).toEqual(2);
        });

        it('should be able to get all of the values', () => {
            const result = times(size, (i) => data.get(i));
            expect(result).toStrictEqual([...values]);
        });
    });
});
