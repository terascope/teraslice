import { isUUID } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '95ecc380-afe9-11e4-9b6c-751b66dd541e',
        output: '95ecc380-afe9-11e4-9b6c-751b66dd541e'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '123e4567-e89b-82d3-f456-426655440000',
        output: '123e4567-e89b-82d3-f456-426655440000'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '95ecc380:afe9:11e4:9b6c:751b66dd541e',
        output: null
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '123e4567-e89b-x2d3-0456-426655440000',
        output: null
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'randomstring',
        output: null
    },
];

export const isUUIDConfig: FieldValidateConfig = {
    name: 'isUUID',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a valid UUID, otherwise returns null.',
    examples,
    create() {
        return isUUID;
    },
    accepts: [FieldType.String]
};
