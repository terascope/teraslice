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
import { encodeSHA } from '../../../src/function-configs/string/encodeSHA';

const encodeSHAConfig = functionConfigRepository.encodeSHA;

describe('EncodeSHA1Config', () => {
    const originalValues = ['some', 'stuff'];
    const encodedValues = originalValues.map((val) => encodeSHA(val));

    it('has proper configuration', () => {
        expect(encodeSHAConfig).toBeDefined();
        expect(encodeSHAConfig).toHaveProperty('name', 'encodeSHA');
        expect(encodeSHAConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(encodeSHAConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(encodeSHAConfig).toHaveProperty('description');
        expect(encodeSHAConfig).toHaveProperty('accepts', []);
        expect(encodeSHAConfig).toHaveProperty('create');
        expect(encodeSHAConfig.create).toBeFunction();
    });

    it('can encode url values', () => {
        const encodeURL = encodeSHAConfig.create({});

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
                obj[field] = encodeSHA(obj[field]);
                return obj;
            }
        );

        it('should be able to transform a column using encodeSHA', () => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, originalValues.slice());
            const api = dataFrameAdapter(encodeSHAConfig);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual(encodedValues);
        });

        it('should be able to transform a dataFrame using encodeSHA', () => {
            const frame = DataFrame.fromJSON(frameTestConfig, frameData);
            const api = dataFrameAdapter(encodeSHAConfig, { field });
            const newFrame = api.frame(frame);

            const results = newFrame.toJSON();

            expect(results).toBeArrayOfSize(2);

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
