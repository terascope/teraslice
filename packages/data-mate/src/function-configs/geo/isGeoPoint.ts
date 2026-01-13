import { isGeoPoint } from '@terascope/geo-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig,
    ProcessMode,
    FunctionDefinitionType,
    FunctionDefinitionCategory,
} from '../interfaces.js';

export const isGeoPointConfig: FieldValidateConfig = {
    name: 'isGeoPoint',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.FULL_VALUES,
    category: FunctionDefinitionCategory.GEO,
    description: 'Returns the input if it is parsable to a geo-point, otherwise returns null',
    examples: [
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: '60,40',
            output: '60,40',
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Number, array: true } } },
            field: 'testField',
            input: [60, 40],
            output: [60, 40],
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Object } } },
            field: 'testField',
            input: { lat: 60, lon: 40 },
            output: { lat: 60, lon: 40 },
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.Object } } },
            field: 'testField',
            input: { latitude: 60, longitude: 40 },
            output: { latitude: 60, longitude: 40 }
        },
        {
            args: {},
            config: { version: 1, fields: { testField: { type: FieldType.String } } },
            field: 'testField',
            input: 'something',
            output: null
        },
    ],
    create() {
        return isGeoPoint;
    },
    accepts: [],
};
