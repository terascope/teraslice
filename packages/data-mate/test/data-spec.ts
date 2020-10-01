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
                expect(data.distinct()).toEqual(5);
            });

            it('should be able to get all of the values', () => {
                const result = times(size, (i) => data.get(i));
                expect(result).toStrictEqual([...values]);
            });
        });
    });
});
