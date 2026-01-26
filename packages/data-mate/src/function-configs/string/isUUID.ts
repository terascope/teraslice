import { isUUID, isString, joinList } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import validator from 'validator';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';

export interface IsUUIDArgs {
    version?: validator.UUIDVersion;
}

const validVersions = ['1', '2', '3', '4', '5', '6', '7', '8', 'nil', 'max', 'loose', 'all', 1, 2, 3, 4, 5, 6, 7, 8];

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
        input: '123e4567-e89b-82d3-a456-426655440000',
        output: '123e4567-e89b-82d3-a456-426655440000'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: '123e4567-e89b-82d3-f456-426655440000',
        output: null
    },
    {
        args: { version: 'loose' },
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
    create({ args: { version } }) {
        return (input: unknown) => isUUID(input, version as validator.UUIDVersion);
    },
    argument_schema: {
        version: {
            type: FieldType.String,
            description: 'Specify version of UUID to verify, defaults to all.  Also accepts loose which checks if the string is UUID-like with hexadecimal values, ignoring RFC9565.'
        }
    },
    accepts: [FieldType.String],
    required_arguments: [],
    validate_arguments({ version }: IsUUIDArgs) {
        if (version == null || (isString(version)
            && validVersions.includes(version))) {
            return;
        }

        throw new Error(`Invalid version, version options are ${joinList(validVersions)}`);
    }
};
