import { geoContainsFP, toGeoJSON } from '@terascope/utils';
import { FieldType, GeoInput } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
    FunctionDefinitionExample
} from '../interfaces';

export interface GeoContainsArgs {
    geoInput: GeoInput;
}

const examples: FunctionDefinitionExample<GeoContainsArgs>[] = [
    // {
    //     args: { point: '33.435518,-111.873616', distance: '5000m' },
    //     config: { version: 1, fields: { testField: { type: FieldType.GeoJSON } } },
    //     field: 'testField',
    //     input: '33.435967,-111.867710',
    //     output: '33.435967,-111.867710',
    // },
];

export const geoContainsConfig: FieldValidateConfig<GeoContainsArgs> = {
    name: 'geoContains',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    examples,
    description: 'Compares geo points/polygons/multi-polygons against other points/polygons/multi-polygons',
    create({ geoInput }) {
        return geoContainsFP(geoInput);
    },
    accepts: [
        FieldType.GeoJSON,
        FieldType.GeoPoint,
        FieldType.Object,
        FieldType.String,
        FieldType.Number
    ],
    argument_schema: {
        geoInput: {
            type: FieldType.Any,
            description: 'The geo input used to compare to other geo entities'
        }
    },
    required_arguments: ['geoInput'],
    validate_arguments({ geoInput }) {
        const input = toGeoJSON(geoInput);
        if (!input) {
            throw new Error(`Invalid parameter geoInput: ${JSON.stringify(geoInput)}, is not a valid geo-json`);
        }
    }
};
