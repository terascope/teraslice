import 'jest-extended';
import { toString, isEmpty } from '@terascope/utils';
import {
    FieldType, DataTypeFields, Maybe
} from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dataFrameAdapter
} from '../../../src';

const toStringConfig = functionConfigRepository.toString;

describe('toStringConfig', () => {
    const originalValues = [true, 'chilly', 1234123, { hello: 'world' }];
    const testValues = originalValues
        .map((val) => toString(val));

    it('has proper configuration', () => {
        expect(toStringConfig).toBeDefined();
        expect(toStringConfig).toHaveProperty('name', 'toString');
        expect(toStringConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toStringConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(toStringConfig).toHaveProperty('description');
        expect(toStringConfig).toHaveProperty('accepts', []);
        expect(toStringConfig).toHaveProperty('create');
        expect(toStringConfig.create).toBeFunction();
    });

    it('can values to string', () => {
        const toStringFn = toStringConfig.create({});

        originalValues.forEach((val, ind) => {
            expect(toStringFn(val)).toEqual(testValues[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        it('should be able to transform a column of Long Values using toString', () => {
            const multiplier = BigInt(20);
            const values: Maybe<bigint>[] = [
                BigInt(16) ** multiplier,
                BigInt(21) ** multiplier,
                BigInt(19) ** multiplier,
                null,
                BigInt(12) ** multiplier
            ];
            const col = Column.fromJSON<bigint>('score', {
                type: FieldType.Long,
            }, values);
            const api = dataFrameAdapter(toStringConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual([
                '1208925819614629174706175',
                '278218429446951548637196400',
                '37589973457545958193355600',
                undefined,
                '3833759992447475122175',
            ]);
        });

        it('should be able to transform a column of array values using toString', () => {
            const values: Maybe<boolean[]>[] = [
                [true, false],
                [false],
                undefined,
                [true, true, true]
            ];

            const col = Column.fromJSON<boolean[]>('myBool', {
                type: FieldType.Boolean,
                array: true
            }, values);
            const api = dataFrameAdapter(toStringConfig);
            const newCol = api.column(col);

            const { type, array } = newCol.config;

            expect(type).toEqual(FieldType.String);
            expect(array).toBeTrue();

            expect(newCol.toJSON()).toEqual([
                ['true', 'false'],
                ['false'],
                undefined,
                ['true', 'true', 'true']
            ]);
        });

        it('should be able to transforms a column of objects, and deal with child_configs', () => {
            const frameTestChildConfig: DataTypeFields = {
                foo: {
                    type: FieldType.String
                },
                num: {
                    type: FieldType.Number
                }
            };

            const values = [
                { foo: 'bar', num: 3 },
                { foo: 'baz' },
                null,
                { num: 938383 }
            ];
            const expectedValues = values.map((obj: unknown) => {
                if (obj) return JSON.stringify(obj);
                return;
            });
            const col = Column.fromJSON('myObj', {
                type: FieldType.Object,
            }, values, 1, frameTestChildConfig);

            const api = dataFrameAdapter(toStringConfig);
            const newCol = api.column(col);

            const { config: { type, array }, vector: { childConfig } } = newCol;

            expect(type).toEqual(FieldType.String);
            expect(array).toBeFalsy();
            expect(isEmpty(childConfig)).toBeTrue();

            expect(newCol.toJSON()).toEqual(expectedValues);
        });
    });
});
