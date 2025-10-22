import {
    geoPointWithinRangeFP, isGeoPoint, joinList,
    parseGeoDistance
} from '@terascope/core-utils';
import { FieldType, GEO_DISTANCE_UNITS, GeoPointInput } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory
} from '../interfaces.js';

export interface GeoPointWithinRangeArgs {
    point: GeoPointInput;
    distance: string;
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
    description: 'Returns the input if it\'s distance to the args point is less then or equal to the args distance.',
    create({ args: { point, distance } }) {
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
            description: 'The geo-point used as the center of the geo circle.'
        },
        distance: {
            type: FieldType.String,
            description: `Value of the radius of the geo-circle.
              It combines the number and the unit of measurement (ie 110km, 20in, 100yards).
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
