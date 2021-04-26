import 'jest-extended';
import { FieldType, Maybe } from '@terascope/types';
import { bigIntToJSON } from '@terascope/utils';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
    dateFrameAdapter, Column
} from '../../src';

describe('decrement', () => {
    const decrementConfigConfig = functionConfigRepository.decrement;

    describe('decrementConfigConfig', () => {
        it('has proper configuration', () => {
            expect(decrementConfigConfig).toBeDefined();
            expect(decrementConfigConfig).toHaveProperty('name', 'decrement');
            expect(decrementConfigConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
            expect(decrementConfigConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
            expect(decrementConfigConfig).toHaveProperty('description');
            expect(decrementConfigConfig).toHaveProperty('accepts', [
                FieldType.Number,
                FieldType.Byte,
                FieldType.Short,
                FieldType.Integer,
                FieldType.Float,
                FieldType.Long,
                FieldType.Double
            ]);
            expect(decrementConfigConfig).toHaveProperty('create');
            expect(decrementConfigConfig.create).toBeFunction();
        });

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

            it('should be able to transform the column using decrement', () => {
                const decrement = dateFrameAdapter(decrementConfigConfig).column;
                const newCol = decrement(col);

                expect(newCol.id).not.toBe(col.id);
                expect(newCol.config).toEqual(col.config);

                expect(newCol.toJSON()).toEqual(values.map((value) => {
                    if (value == null) return undefined;
                    return value - 1;
                }));
            });

            it('should be able to transform the column using decrement(by: 1.5)', () => {
                const args = { by: 1.5 };
                const decrement = dateFrameAdapter(decrementConfigConfig, { args }).column;

                const newCol = decrement(col);

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

            it('should be able to transform the column using decrement(by: 1.5)', () => {
                const args = { by: 1.5 };
                const decrement = dateFrameAdapter(decrementConfigConfig, { args }).column;

                const newCol = decrement(col);

                expect(newCol.id).not.toBe(col.id);
                expect(newCol.config).toEqual(col.config);

                expect(newCol.toJSON()).toEqual(values.map((value) => {
                    if (value == null) return undefined;
                    return value - 1.5;
                }));
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

            it('should be able to transform the column using decrement(by: 100)', () => {
                const args = { by: 100 };
                const decrement = dateFrameAdapter(decrementConfigConfig, { args }).column;

                const newCol = decrement(col);
                expect(newCol.id).not.toBe(col.id);
                expect(newCol.config).toEqual(col.config);

                expect(newCol.toJSON()).toEqual(values.map((value) => {
                    if (value == null) return undefined;
                    return bigIntToJSON(value - BigInt(100));
                }));
            });
        });
    });
});
