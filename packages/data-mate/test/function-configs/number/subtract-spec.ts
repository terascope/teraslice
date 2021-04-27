import 'jest-extended';
import { FieldType, Maybe } from '@terascope/types';
import { bigIntToJSON } from '@terascope/utils';
import {
    functionConfigRepository, FunctionDefinitionType, ProcessMode,
    dataFrameAdapter, Column
} from '../../../src';

describe('subtract', () => {
    const subtractConfigConfig = functionConfigRepository.subtract;

    describe('subtractConfigConfig', () => {
        it('has proper configuration', () => {
            expect(subtractConfigConfig).toBeDefined();
            expect(subtractConfigConfig).toHaveProperty('name', 'subtract');
            expect(subtractConfigConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
            expect(subtractConfigConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
            expect(subtractConfigConfig).toHaveProperty('description');
            expect(subtractConfigConfig).toHaveProperty('accepts', [
                FieldType.Number,
                FieldType.Byte,
                FieldType.Short,
                FieldType.Integer,
                FieldType.Float,
                FieldType.Long,
                FieldType.Double
            ]);
            expect(subtractConfigConfig).toHaveProperty('create');
            expect(subtractConfigConfig.create).toBeFunction();
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

            it('should be able to transform the column using subtract', () => {
                const subtract = dataFrameAdapter(subtractConfigConfig).column;
                const newCol = subtract(col);

                expect(newCol.id).not.toBe(col.id);
                expect(newCol.config).toEqual(col.config);

                expect(newCol.toJSON()).toEqual(values.map((value) => {
                    if (value == null) return undefined;
                    return value - 1;
                }));
            });

            it('should be able to transform the column using subtract(by: 1.5)', () => {
                const args = { by: 1.5 };
                const subtract = dataFrameAdapter(subtractConfigConfig, { args }).column;

                const newCol = subtract(col);

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

            it('should be able to transform the column using subtract(by: 1.5)', () => {
                const args = { by: 1.5 };
                const subtract = dataFrameAdapter(subtractConfigConfig, { args }).column;

                const newCol = subtract(col);

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

            it('should be able to transform the column using subtract(by: 100)', () => {
                const args = { by: 100 };
                const subtract = dataFrameAdapter(subtractConfigConfig, { args }).column;

                const newCol = subtract(col);
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
