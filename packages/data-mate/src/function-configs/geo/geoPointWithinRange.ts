import {
    geoPointWithinRangeFP, isGeoPoint, joinList,
    parseGeoDistance
} from '@terascope/utils';
import { FieldType, GeoPointInput, GEO_DISTANCE_UNITS } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces';

export interface GeoPointWithinRangeArgs {
    point: GeoPointInput;
    distance: string
}

export const geoPointWithinRangeConfig: FieldValidateConfig<GeoPointWithinRangeArgs> = {
    name: 'geoPointWithinRange',
    aliases: ['geoDistance'],
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples: [
        {
            args: { point: '33.435518,-111.873616', distance: '5000m' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '33.435967,-111.867710',
            output: '33.435967,-111.867710',
        },
        {
            args: { point: '33.435518,-111.873616', distance: '5000m' },
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '22.435967,-150.867710',
            output: null,
        },
    ],
    description: 'Checks to see if input geo-point is within range of the point and distance values provided',
    create({ point, distance }) {
        return geoPointWithinRangeFP(point, distance);
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
        point: {
            type: FieldType.Any,
            description: 'The geo-point used to compare to other points'
        },
        distance: {
            type: FieldType.String,
            description: `The range from the point that will provide a positive result.
              It combines the number as well as the unit of measurement (ie 110km, 20in, 100yards).
                Possible units are as follows: ${joinList(Object.keys(GEO_DISTANCE_UNITS), ', ')}
            `.trim()
        }
    },
    required_arguments: ['point', 'distance'],
    validate_arguments({ point, distance }) {
        if (!isGeoPoint(point)) {
            throw new Error(`Invalid parameter point: ${point}, is not a valid geo-point`);
        }

        // this will throw if distance is invalids
        parseGeoDistance(distance);
    }
};
