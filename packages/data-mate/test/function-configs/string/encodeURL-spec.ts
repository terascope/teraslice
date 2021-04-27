import 'jest-extended';
import { cloneDeep } from '@terascope/utils';
import {
    FieldType, DataTypeConfig
} from '@terascope/types';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dataFrameAdapter, DataFrame, VectorType
} from '../../../src';

const encodeURLConfig = functionConfigRepository.encodeURL;

function encode(input: any) {
    return encodeURIComponent(input);
}

describe('encodeURLConfig', () => {
    const originalValues = ['google.com?q=HELLO AND GOODBYE'];
    const encodedValues = originalValues.map(encode);

    it('has proper configuration', () => {
        expect(encodeURLConfig).toBeDefined();
        expect(encodeURLConfig).toHaveProperty('name', 'encodeURL');
        expect(encodeURLConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(encodeURLConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(encodeURLConfig).toHaveProperty('description');
        expect(encodeURLConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(encodeURLConfig).toHaveProperty('create');
        expect(encodeURLConfig.create).toBeFunction();
    });

    it('can encode url values', () => {
        const encodeURL = encodeURLConfig.create({});

        originalValues.slice().forEach((val, ind) => {
            expect(encodeURL(val)).toEqual(encodedValues[ind]);
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

        it('should be able to transform a column using encodeURL', () => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, originalValues.slice());
            const api = dataFrameAdapter(encodeURLConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual(encodedValues);
        });

        it('should be able to transform a dataFrame using encodeURL', () => {
            const frame = DataFrame.fromJSON(frameTestConfig, frameData);
            const api = dataFrameAdapter(encodeURLConfig, { field });
            const newFrame = api.frame(frame);

            const results = newFrame.toJSON();

            expect(results).toBeArrayOfSize(1);

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
