import 'jest-extended';
import {
    FieldType, DataTypeConfig
} from '@terascope/types';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dataFrameAdapter, DataFrame, VectorType
} from '../../../src';

const decodeHexConfig = functionConfigRepository.decodeHex;

describe('decodeHexConfig', () => {
    const originalValues = ['Hello', 'chilly', 'willy'];
    const testValues = originalValues
        .map((str) => Buffer.from(str).toString('hex'));

    it('has proper configuration', () => {
        expect(decodeHexConfig).toBeDefined();
        expect(decodeHexConfig).toHaveProperty('name', 'decodeHex');
        expect(decodeHexConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(decodeHexConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(decodeHexConfig).toHaveProperty('description');
        expect(decodeHexConfig).toHaveProperty('accepts', [
            FieldType.String,
        ]);
        expect(decodeHexConfig).toHaveProperty('create');
        expect(decodeHexConfig.create).toBeFunction();
    });

    it('can decode hex values', () => {
        const decodeHex = decodeHexConfig.create({});

        testValues.forEach((val, ind) => {
            expect(decodeHex(val)).toEqual(originalValues[ind]);
        });
    });

    describe('can work with dataFrameAdapter', () => {
        let col: Column<string>;
        const field = 'someField';

        const frameTestConfig: DataTypeConfig = {
            version: LATEST_VERSION,
            fields: {
                [field]: {
                    type: FieldType.String
                },
                num: {
                    type: FieldType.Number
                }
            }
        };

        const frameData = testValues.map((str, ind) => ({ [field]: str as string, num: ind }));

        it('should be able to transform a column using decodeHex', () => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, testValues);
            const api = dataFrameAdapter(decodeHexConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual(originalValues);
        });

        it('should be able to transform a dataFrame using decodeHex', () => {
            const frame = DataFrame.fromJSON(frameTestConfig, frameData);

            const api = dataFrameAdapter(decodeHexConfig, { field });
            const newFrame = api.frame(frame);

            expect(newFrame.toJSON()).toEqual([
                { [field]: 'Hello', num: 0 },
                { [field]: 'chilly', num: 1 },
                { [field]: 'willy', num: 2 },
            ]);

            const [type] = newFrame.columns
                .filter((column) => column.name === field)
                .map((column) => column.vector.type);

            expect(type).toEqual(VectorType.String);
        });
    });
});
