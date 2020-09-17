import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import {
    BigIntVector,
    Column, Vector
} from '../src';

describe('Column', () => {
    describe(`when field type is ${FieldType.Keyword}`, () => {
        let col: Column<string>;
        const values: Maybe<string>[] = [
            'Batman',
            'Robin',
            'Superman',
            null,
            'SpiderMan',
        ];
        beforeEach(() => {
            col = Column.fromJSON<string>({
                name: 'name',
                config: {
                    type: FieldType.Keyword,
                },
            }, values);
        });

        it('should have the correct size', () => {
            expect(col.count()).toEqual(values.length);
        });

        it('should have the same id when forked with the same vector', () => {
            expect(col.fork().id).toEqual(col.id);
        });

        it('should NOT have the same id when forked with a different vector', () => {
            const vector = col.vector.slice(0, 2);
            expect(col.fork(vector).id).not.toEqual(col.id);
        });

        it('should be able to iterate over the values', () => {
            expect([...col]).toEqual(values);
            expect(col.toJSON()).toEqual(values);
        });

        it('should be able to get the Vector', () => {
            expect(col.vector).toBeInstanceOf(Vector);
        });

        test.todo('should be immutable');
        test.todo('->map');
        test.todo('->reduce');
        test.todo('->filter');
        test.todo('->transform');
    });

    describe(`when field type is ${FieldType.Short}`, () => {
        let col: Column<number>;
        const values: Maybe<number>[] = [
            7,
            2,
            6,
            null,
            4,
        ];
        beforeEach(() => {
            col = Column.fromJSON<number>({
                name: 'score',
                config: {
                    type: FieldType.Short,
                },
            }, values);
        });

        it('should be able to get the avg of the values', () => {
            expect(col.avg()).toBe(4.75);
        });

        it('should be able to get the sum of the values', () => {
            expect(col.sum()).toBe(19);
        });

        it('should be able to get the min of the values', () => {
            expect(col.min()).toBe(2);
        });

        it('should be able to get the max of the values', () => {
            expect(col.max()).toBe(7);
        });

        it('should be able to sort the values in asc order', () => {
            expect(col.sort().toJSON()).toEqual([
                null,
                2,
                4,
                6,
                7,
            ]);
        });

        it('should be able to sort the values in desc order', () => {
            expect(col.sort('desc').toJSON()).toEqual([
                7,
                6,
                4,
                2,
                null,
            ]);
        });
    });

    describe(`when field type is an array of ${FieldType.Short}`, () => {
        let col: Column<Vector<number>>;
        const values: Maybe<Maybe<number>[]>[] = [
            [7, 3],
            [2, null, 4],
            [6, 324, 5],
            null,
            [4, 2, 0],
        ];
        beforeEach(() => {
            col = Column.fromJSON<number[]>({
                name: 'score',
                config: {
                    type: FieldType.Short,
                    array: true
                },
            }, values as number[][]);
        });

        it('should be able to get the avg of the values', () => {
            expect(col.avg()).toBe(35.7);
        });

        it('should be able to get the sum of the values', () => {
            expect(col.sum()).toBe(357);
        });

        it('should be able to get the min of the values', () => {
            expect(col.min()).toBe(0);
        });

        it('should be able to get the max of the values', () => {
            expect(col.max()).toBe(324);
        });

        test.todo('should NOT be able to sort the values');
    });

    describe(`when field type is ${FieldType.Long}`, () => {
        let col: Column<bigint>;
        const multiplier = BigInt(20);
        const values: Maybe<bigint>[] = [
            BigInt(16) ** multiplier,
            BigInt(21) ** multiplier,
            BigInt(19) ** multiplier,
            null,
            BigInt(12) ** multiplier
        ];
        beforeEach(() => {
            col = Column.fromJSON<bigint>({
                name: 'score',
                config: {
                    type: FieldType.Long,
                },
            }, values);
        });

        it('should be able to get the avg of the values', () => {
            expect(
                (col.avg() as bigint).toLocaleString('en-US')
            ).toBe('79,255,290,621,026,145,870,095,088');
        });

        it('should be able to get the sum of the values', () => {
            expect(
                (col.sum() as bigint).toLocaleString('en-US')
            ).toBe('317,021,162,484,104,583,480,380,354');
        });

        it('should be able to get the min of the values', () => {
            expect(
                (col.min() as bigint).toLocaleString('en-US')
            ).toBe('3,833,759,992,447,475,122,176');
        });

        it('should be able to get the max of the values', () => {
            expect(
                (col.max() as bigint).toLocaleString('en-US')
            ).toBe('278,218,429,446,951,548,637,196,401');
        });

        it('should be able to sort the values in asc order', () => {
            expect(col.sort().toJSON()).toEqual([
                null,
                BigIntVector.valueToJSON(BigInt(12) ** multiplier),
                BigIntVector.valueToJSON(BigInt(16) ** multiplier),
                BigIntVector.valueToJSON(BigInt(19) ** multiplier),
                BigIntVector.valueToJSON(BigInt(21) ** multiplier),
            ]);
        });

        it('should be able to sort the values in desc order', () => {
            expect(col.sort('desc').toJSON()).toEqual([
                BigIntVector.valueToJSON(BigInt(21) ** multiplier),
                BigIntVector.valueToJSON(BigInt(19) ** multiplier),
                BigIntVector.valueToJSON(BigInt(16) ** multiplier),
                BigIntVector.valueToJSON(BigInt(12) ** multiplier),
                null,
            ]);
        });
    });
});
