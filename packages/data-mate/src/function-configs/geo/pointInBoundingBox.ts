import { pointInBoundingBoxFP, isGeoPoint } from '@terascope/utils';
import { FieldType, GeoPointInput } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export interface PointInBoundingBoxArgs {
    top_left: GeoPointInput;
    bottom_right: GeoPointInput
}

// TODO: have a test example with FieldType.GeoPoint will cause the date-frame
// to convert it to a parsed geoPoint, but the functionAdapter will not do so

export const pointInBoundingBoxConfig: FieldValidateConfig<PointInBoundingBoxArgs> = {
    name: 'pointInBoundingBox',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples: [
        {
            args: { top_left: '33.906320,-112.758421', bottom_right: '32.813646,-111.058902' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '33.2,-112.3',
            output: '33.2,-112.3',
        },
        {
            args: { top_left: '33.906320,-112.758421', bottom_right: '32.813646,-111.058902' },
            config: { version: 1, fields: { testField: { type: FieldType.GeoPoint } } },
            field: 'testField',
            input: '43,-132',
            output: null
        },
        {
            args: { top_left: '33.906320,-112.758421', bottom_right: '32.813646,-111.058902' },
            config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
            field: 'testField',
            input: { type: 'Point', coordinates: [-112, 33] },
            output: { type: 'Point', coordinates: [-112, 33] },
        },
    ],
    description: 'Checks to see if input is within the geo bounding-box',
    create({ top_left, bottom_right }) {
        const fn = pointInBoundingBoxFP(top_left, bottom_right);
        return (input: unknown) => fn(input as GeoPointInput);
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.GeoPoint,
        FieldType.Object,
        FieldType.String,
        FieldType.Number
    ],
    argument_schema: {
        top_left: {
            type: FieldType.Any,
            description: 'The top-left geo-point used to construct the geo bounding box, must be a valid geo-point input'
        },
        bottom_right: {
            type: FieldType.Any,
            description: 'The bottom_right geo-point used to construct the geo bounding box, must be a valid geo-point input'
        }
    },
    required_arguments: ['top_left', 'bottom_right'],
    validate_arguments({ top_left, bottom_right }) {
        if (!isGeoPoint(top_left)) {
            throw new Error(`Invalid parameter top_left: ${top_left}, is not a valid geo-point`);
        }

        if (!isGeoPoint(bottom_right)) {
            throw new Error(`Invalid parameter bottom_right: ${bottom_right}, is not a valid geo-point`);
        }
    }
};
