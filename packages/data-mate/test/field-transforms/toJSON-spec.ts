import 'jest-extended';
import {
    FieldType, DataTypeConfig, Maybe
} from '@terascope/types';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dateFrameAdapter, DataFrame, VectorType
} from '../../src';

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

    it('can decode hex values', () => {
        const toJSON = toJSONConfig.create({});

        originalValues.forEach((val, ind) => {
            expect(toJSON(val)).toEqual(testValues[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        const field = 'someField';

        const frameTestConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                [field]: {
                    type: FieldType.String
                },
                num: {
                    type: FieldType.Long
                }
            }
        };

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
            const api = dateFrameAdapter(toJSONConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual([
                '1208925819614629174706175',
                '278218429446951548637196400',
                '37589973457545958193355600',
                undefined,
                '3833759992447475122175',
            ]);
        });

        fit('should be able to transform a column of array values using toJSON', () => {
            const values: Maybe<boolean[]>[] = [[true, false], [false], undefined, [true, true, true]];
            const col = Column.fromJSON<boolean[]>('myBool', {
                type: FieldType.Boolean,
                array: true
            }, values);
            const api = dateFrameAdapter(toJSONConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual([
                '1208925819614629174706175',
                '278218429446951548637196400',
                '37589973457545958193355600',
                undefined,
                '3833759992447475122175',
            ]);
        });

        it.todo('should be able to transform a dataFrame using toJSON');
    });
});
