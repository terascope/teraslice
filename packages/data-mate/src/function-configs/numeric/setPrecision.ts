import {
    parseGeoPoint,
    setPrecisionFP,
    setPrecision
} from '@terascope/core-utils';
import { FieldType, GeoPointInput } from '@terascope/types';
import {
    FieldTransformConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export interface SetPrecisionArgs {
    readonly digits: number;
    readonly truncate?: boolean;
}

export const setPrecisionConfig: FieldTransformConfig<SetPrecisionArgs> = {
    name: 'setPrecision',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.NUMERIC,
    description: 'Returns a truncated number to the nth decimal places. The values will skip rounding if truncate: true is specified',
    examples: [
        {
            args: { digits: 1, truncate: false },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: '10.123444',
            output: 10.1
        },
        {
            args: { digits: 1, truncate: true },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 10.253444,
            output: 10.2
        },
        {
            args: { digits: 1, truncate: false },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 10.253444,
            output: 10.3
        },
        {
            args: { digits: 2 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: Math.PI,
            output: 3.14
        },
        {
            args: { digits: 0 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: Math.PI,
            output: 3
        },
        {
            args: { digits: -1 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 23.4,
            fails: true,
            output: 'Expected digits to be between 0-100'
        },
        {
            args: { digits: 1000 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Float } }
            },
            field: 'testField',
            input: 23.4,
            fails: true,
            output: 'Expected digits to be between 0-100'
        },
        {
            args: { digits: 2, truncate: true },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.GeoPoint } }
            },
            field: 'testField',
            input: { lat: 32.12399971230023, lon: -20.95522300035 },
            output: { lat: 32.12, lon: -20.95 }
        },
        {
            args: { digits: 2, truncate: true },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Geo } }
            },
            field: 'testField',
            input: { lat: 32.12399971230023, lon: -20.95522300035 },
            output: { lat: 32.12, lon: -20.95 }
        },
        {
            args: { digits: 2 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Integer } }
            },
            field: 'testField',
            input: Number.NaN,
            output: Number.NaN
        },
        {
            args: { digits: 2 },
            config: {
                version: 1,
                fields: { testField: { type: FieldType.Integer } }
            },
            field: 'testField',
            input: Number.POSITIVE_INFINITY,
            output: Number.POSITIVE_INFINITY
        }
    ],
    create({ args: { digits, truncate = false }, inputConfig }) {
        if (inputConfig?.field_config.type === FieldType.GeoPoint
            || inputConfig?.field_config.type === FieldType.Geo) {
            return function _geoPointToPrecision(input: unknown) {
                const geoPoint = parseGeoPoint(input as GeoPointInput, true);
                return {
                    lat: setPrecision(geoPoint.lat, digits, truncate),
                    lon: setPrecision(geoPoint.lon, digits, truncate),
                };
            };
        }

        return setPrecisionFP(digits, truncate);
    },
    accepts: [
        FieldType.Number,
        FieldType.GeoPoint,
        FieldType.Geo
    ],
    argument_schema: {
        digits: {
            type: FieldType.Number,
            array: false,
            description: 'The number of decimal places to keep. This value must be between 0-100'
        },
        truncate: {
            type: FieldType.Boolean,
            array: false,
            description: 'If set to true rounding will be disabled'
        }
    },
    required_arguments: ['digits'],
    validate_arguments({ digits }) {
        if (digits < 0 || digits > 100) {
            throw new RangeError('Expected digits to be between 0-100');
        }
    }
};
