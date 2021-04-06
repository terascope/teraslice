import 'jest-fixtures';
import { FieldType, Maybe } from '@terascope/types';
import { bigIntToJSON } from '@terascope/utils';
import {
    Column, ColumnTransform
} from '../../src';

describe('Column (Number Types)', () => {
    describe('when field type is Short', () => {
        let col: Column<number>;
        const values: Maybe<number>[] = [
            7,
            2,
            6,
            null,
            4,
        ];

        beforeEach(() => {
            col = Column.fromJSON<number>('score', {
                type: FieldType.Short,
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
            expect(col.sort().toJSON()).toStrictEqual([
                undefined,
                2,
                4,
                6,
                7,
            ]);
        });

        it('should be able to sort the values in desc order', () => {
            expect(col.sort('desc').toJSON()).toStrictEqual([
                7,
                6,
                4,
                2,
                undefined,
            ]);
        });

        it('should be able to transform the column using toString', () => {
            const newCol = col.transform(ColumnTransform.toString);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.String
            });

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return `${value}`;
            }));
        });

        it('should be able to transform using cast(type: "Keyword", array: true, description: "foo")', () => {
            const newCol = col.transform(ColumnTransform.cast, {
                type: FieldType.Keyword,
                array: true,
                description: 'foo'
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.Keyword,
                array: true,
                description: 'foo'
            });
            expect(newCol.toJSON()).toEqual([
                ['7'],
                ['2'],
                ['6'],
                undefined,
                ['4'],
            ]);
        });

        it('should be able to transform the column using increment', () => {
            const newCol = col.transform(ColumnTransform.increment);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return value + 1;
            }));
        });

        it('should be able to transform the column using increment(by: 1.5)', () => {
            const newCol = col.transform(ColumnTransform.increment, {
                by: 1.5
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return parseInt(`${value + 1.5}`, 10);
            }));
        });

        it('should be able to transform the column using decrement', () => {
            const newCol = col.transform(ColumnTransform.decrement);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return value - 1;
            }));
        });

        it('should be able to transform the column using decrement(by: 1.5)', () => {
            const newCol = col.transform(ColumnTransform.decrement, {
                by: 1.5
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return parseInt(`${value - 1.5}`, 10);
            }));
        });
    });

    describe('when field type is Float', () => {
        let col: Column<number>;
        const values: Maybe<number>[] = [
            7.92334,
            2.2444233334,
            6,
            null,
            4.3333334,
        ];
        beforeEach(() => {
            col = Column.fromJSON<number>('score', {
                type: FieldType.Float,
            }, values);
        });

        it('should be able to get the avg of the values', () => {
            expect(col.avg()).toBe(5.12527418335);
        });

        it('should be able to get the sum of the values', () => {
            expect(col.sum()).toBe(20.5010967334);
        });

        it('should be able to get the min of the values', () => {
            expect(col.min()).toBe(2.2444233334);
        });

        it('should be able to get the max of the values', () => {
            expect(col.max()).toBe(7.92334);
        });

        it('should be able to sort the values in asc order', () => {
            expect(col.sort().toJSON()).toStrictEqual([
                undefined,
                2.2444233334,
                4.3333334,
                6,
                7.92334,
            ]);
        });

        it('should be able to sort the values in desc order', () => {
            expect(col.sort('desc').toJSON()).toEqual([
                7.92334,
                6,
                4.3333334,
                2.2444233334,
                undefined,
            ]);
        });

        it('should be able to transform the column using toString', () => {
            const newCol = col.transform(ColumnTransform.toString);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.String
            });

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return `${value}`;
            }));
        });

        it('should be able to transform the column using increment(by: 1.5)', () => {
            const newCol = col.transform(ColumnTransform.increment, {
                by: 1.5
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return value + 1.5;
            }));
        });

        it('should be able to transform the column using decrement(by: 1.5)', () => {
            const newCol = col.transform(ColumnTransform.decrement, {
                by: 1.5
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return value - 1.5;
            }));
        });
    });

    describe(`when field type is an array of ${FieldType.Short}`, () => {
        let col: Column<number[]>;
        const values: Maybe<Maybe<number>[]>[] = [
            [7, 3],
            [2, null, 4],
            [6, 324, 5],
            null,
            [4, 2, 0],
        ];
        beforeEach(() => {
            col = Column.fromJSON<number[]>('score', {
                type: FieldType.Short,
                array: true
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

        it('should be able to transform the column using toString', () => {
            const newCol = col.transform(ColumnTransform.toString);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.String
            });

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;

                return value.map((val) => (
                    val != null ? `${val}` : undefined
                ));
            }));
        });

        it('should be able to transform the column using setDefault(value: 100)', () => {
            const newCol = col.transform(ColumnTransform.setDefault, {
                value: 100,
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual([
                [7, 3],
                [2, 100, 4],
                [6, 324, 5],
                [100],
                [4, 2, 0],
            ]);
        });

        it('should be able to transform the column using setDefault(value: [-50])', () => {
            const newCol = col.transform(ColumnTransform.setDefault, {
                value: [-50],
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual([
                [7, 3],
                [2, undefined, 4],
                [6, 324, 5],
                [-50],
                [4, 2, 0],
            ]);
        });

        it('should NOT be able to sort the values', () => {
            expect(() => {
                col.sort();
            }).toThrow('Sorting is not supported for ListVector');
        });
    });

    describe('when field type is Long', () => {
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
            col = Column.fromJSON<bigint>('score', {
                type: FieldType.Long,
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
            expect(col.sort().toJSON()).toStrictEqual([
                undefined,
                bigIntToJSON(BigInt(12) ** multiplier),
                bigIntToJSON(BigInt(16) ** multiplier),
                bigIntToJSON(BigInt(19) ** multiplier),
                bigIntToJSON(BigInt(21) ** multiplier),
            ]);
        });

        it('should be able to sort the values in desc order', () => {
            expect(col.sort('desc').toJSON()).toStrictEqual([
                bigIntToJSON(BigInt(21) ** multiplier),
                bigIntToJSON(BigInt(19) ** multiplier),
                bigIntToJSON(BigInt(16) ** multiplier),
                bigIntToJSON(BigInt(12) ** multiplier),
                undefined,
            ]);
        });

        it('should be able to transform the column using toString', () => {
            const newCol = col.transform(ColumnTransform.toString);

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual({
                ...col.config,
                type: FieldType.String
            });

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return `${value}`;
            }));
        });

        it('should be able to transform the column using increment(by: 100)', () => {
            const newCol = col.transform(ColumnTransform.increment, {
                by: 100
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return bigIntToJSON(value + BigInt(100));
            }));
        });

        it('should be able to transform the column using decrement(by: 100)', () => {
            const newCol = col.transform(ColumnTransform.decrement, {
                by: 100
            });

            expect(newCol.id).not.toBe(col.id);
            expect(newCol.config).toEqual(col.config);

            expect(newCol.toJSON()).toEqual(values.map((value) => {
                if (value == null) return undefined;
                return bigIntToJSON(value - BigInt(100));
            }));
        });
    });
});
