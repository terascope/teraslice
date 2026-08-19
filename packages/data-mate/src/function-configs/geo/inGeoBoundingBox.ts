import { inGeoBoundingBoxFP, isGeoPoint } from '@terascope/geo-utils';
import { FieldType, GeoPointInput } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';
import { parseGeoPoint } from '@terascope/geo-utils';
import { isGeoPointColumn, inBoundingBoxSql } from './sql-utils.js';

export interface InGeoBoundingBoxArgs {
    top_left: GeoPointInput;
    bottom_right: GeoPointInput;
}

export const inGeoBoundingBoxConfig: FieldValidateConfig<InGeoBoundingBoxArgs> = {
    name: 'inGeoBoundingBox',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    aliases: ['geoBox'],
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
    description: 'Returns the input if it is within the geo bounding box, otherwise returns null',
    create({ args: { top_left, bottom_right } }) {
        return inGeoBoundingBoxFP(top_left, bottom_right);
    },
    /**
     * Two inclusive range checks on the point struct - no `spatial` extension, and no
     * `ST_Contains`, which would get the boundary wrong. See `inBoundingBoxSql`.
     *
     * `applies` re-validates the box because a pure-SQL emission never calls `create()`, and
     * `createValidGeoBox` is where an inverted or antimeridian-crossing box is rejected. Returning
     * false there sends the call to the UDF, which throws exactly as it does today.
    */
    sql: {
        applies: (args, inputConfig) => {
            if (!isGeoPointColumn(inputConfig)) return false;
            try {
                parseGeoPoint(args.top_left as any);
                parseGeoPoint(args.bottom_right as any);
                return true;
            } catch {
                return false;
            }
        },
        expression: ({ value, args }) => inBoundingBoxSql(
            value,
            parseGeoPoint(args.top_left as any),
            parseGeoPoint(args.bottom_right as any)
        ),
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.GeoPoint,
        FieldType.Geo,
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
