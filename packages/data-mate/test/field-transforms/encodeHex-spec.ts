import 'jest-extended';
import { cloneDeep } from '@terascope/utils';
import {
    FieldType, DataTypeConfig
} from '@terascope/types';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dateFrameAdapter, DataFrame, VectorType
} from '../../src';

const encodeHexConfig = functionConfigRepository.encodeHex;

function encode(val: string) {
    return Buffer.from(val).toString('hex');
}

describe('encodeHexConfig', () => {
    const originalValues = ['Hello', 'chilly', 'willy'];
    const encodedValues = originalValues.map(encode);

    it('has proper configuration', () => {
        expect(encodeHexConfig).toBeDefined();
        expect(encodeHexConfig).toHaveProperty('name', 'encodeHex');
        expect(encodeHexConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(encodeHexConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(encodeHexConfig).toHaveProperty('description');
        expect(encodeHexConfig).toHaveProperty('accepts', []);
        expect(encodeHexConfig).toHaveProperty('create');
        expect(encodeHexConfig.create).toBeFunction();
    });

    it('can encode hex values', () => {
        const encodeHex = encodeHexConfig.create({});

        originalValues.slice().forEach((val, ind) => {
            expect(encodeHex(val)).toEqual(encodedValues[ind]);
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

        const frameData = originalValues.map((str, ind) => ({ [field]: str as string, num: ind }));
        const encodedFrameData = cloneDeep(frameData).map(
            (obj) => {
                obj[field] = encode(obj[field]);
                return obj;
            }
        );

        it('should be able to transform a column using encodeHex', () => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, originalValues.slice());
            const api = dateFrameAdapter(encodeHexConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual(encodedValues);
        });

        it('should be able to transform a dataFrame using encodeHex', () => {
            const frame = DataFrame.fromJSON(frameTestConfig, frameData);
            const api = dateFrameAdapter(encodeHexConfig, { field });
            const newFrame = api.frame(frame);

            const results = newFrame.toJSON();

            expect(results).toBeArrayOfSize(3);

            results.forEach((result, ind) => {
                expect(result).toEqual(encodedFrameData[ind]);
            });

            const [type] = newFrame.columns
                .filter((column) => column.name === field)
                .map((column) => column.vector.type);

            expect(type).toEqual(VectorType.String);
        });
    });
});
