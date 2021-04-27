import 'jest-extended';
import { cloneDeep } from '@terascope/utils';
import {
    FieldType, DataTypeConfig
} from '@terascope/types';
import { LATEST_VERSION } from '@terascope/data-types';
import {
    functionConfigRepository, FunctionDefinitionType,
    ProcessMode, Column, dateFrameAdapter, DataFrame, VectorType
} from '../../../src';
import { encodeSHA1 } from '../../../src/function-configs/string/encodeSHA1';

const encodeSHA1Config = functionConfigRepository.encodeSHA1;

describe('EncodeSHA1Config', () => {
    const originalValues = ['some', 'stuff'];
    const encodedValues = originalValues.map((val) => encodeSHA1(val));

    it('has proper configuration', () => {
        expect(encodeSHA1Config).toBeDefined();
        expect(encodeSHA1Config).toHaveProperty('name', 'encodeSHA1');
        expect(encodeSHA1Config).toHaveProperty('type', FunctionDefinitionType.FIELD_TRANSFORM);
        expect(encodeSHA1Config).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(encodeSHA1Config).toHaveProperty('description');
        expect(encodeSHA1Config).toHaveProperty('accepts', []);
        expect(encodeSHA1Config).toHaveProperty('create');
        expect(encodeSHA1Config.create).toBeFunction();
    });

    it('can encode url values', () => {
        const encodeURL = encodeSHA1Config.create({});

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
                obj[field] = encodeSHA1(obj[field]);
                return obj;
            }
        );

        it('should be able to transform a column using encodeSHA1', () => {
            col = Column.fromJSON<string>(field, {
                type: FieldType.String
            }, originalValues.slice());
            const api = dateFrameAdapter(encodeSHA1Config);
            const newCol = api.column(col);

            expect(newCol.toJSON()).toEqual(encodedValues);
        });

        it('should be able to transform a dataFrame using encodeSHA1', () => {
            const frame = DataFrame.fromJSON(frameTestConfig, frameData);
            const api = dateFrameAdapter(encodeSHA1Config, { field });
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
