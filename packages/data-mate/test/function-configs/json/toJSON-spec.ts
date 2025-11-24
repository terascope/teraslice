import 'jest-extended';
import { isEmpty } from '@terascope/core-utils';
import { FieldType, DataTypeFields, Maybe } from '@terascope/types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dataFrameAdapter, FunctionContext
} from '../../../src/index.js';

const toJSONConfig = functionConfigRepository.toJSON;

describe('toJSONConfig', () => {
    const originalValues = [true, 'chilly', 1234123, { hello: 'world' }];
    const testValues = originalValues
        .map((val) => JSON.stringify(val));

    it('has proper configuration', () => {
        expect(toJSONConfig).toBeDefined();
        expect(toJSONConfig).toHaveProperty('name', 'toJSON');
        expect(toJSONConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(toJSONConfig).toHaveProperty('process_mode', ProcessMode.FULL_VALUES);
        expect(toJSONConfig).toHaveProperty('description');
        expect(toJSONConfig).toHaveProperty('accepts', []);
        expect(toJSONConfig).toHaveProperty('create');
        expect(toJSONConfig.create).toBeFunction();
    });

    it('can convert values to JSON', () => {
        const config: FunctionContext<Record<string, unknown>> = {
            args: {},
            parent: originalValues,
            fnDef: toJSONConfig,
            field_config: { type: FieldType.String, array: false },
        } as FunctionContext<Record<string, unknown>>;

        const toJSON = toJSONConfig.create(config);

        originalValues.forEach((val, ind) => {
            expect(toJSON(val, ind)).toEqual(testValues[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        it('should be able to transform a column of Long Values using toJSON', () => {
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
            const api = dataFrameAdapter(toJSONConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual([
                '1208925819614629174706175',
                '278218429446951548637196400',
                '37589973457545958193355600',
                undefined,
                '3833759992447475122175',
            ]);
        });

        it('should be able to transform a column of array values using toJSON', () => {
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
            const api = dataFrameAdapter(toJSONConfig);
            const newCol = api.column(col);

            const { type, array } = newCol.config;

            expect(type).toEqual(FieldType.String);
            expect(array).toBeFalsy();

            expect(newCol.toJSON()).toEqual([
                '[true,false]',
                '[false]',
                undefined,
                '[true,true,true]'
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

            const api = dataFrameAdapter(toJSONConfig);
            const newCol = api.column(col);

            const { config: { type, array }, vector: { childConfig } } = newCol;

            expect(type).toEqual(FieldType.String);
            expect(array).toBeFalsy();
            expect(isEmpty(childConfig)).toBeTrue();

            expect(newCol.toJSON()).toEqual(expectedValues);
        });
    });
});
