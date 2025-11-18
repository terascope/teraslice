import { toString, toISO8601 } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldTransformConfig, ProcessMode, FunctionDefinitionType,
    DataTypeFieldAndChildren, FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Boolean } } },
        field: 'testField',
        input: true,
        output: 'true'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Object } } },
        field: 'testField',
        input: { hello: 'world' },
        output: '{"hello":"world"}'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Long } } },
        field: 'testField',
        input: BigInt(21) ** BigInt(20),
        output: '278218429446951548637196400'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.Boolean, array: true } } },
        field: 'testField',
        input: [true, false],
        output: ['true', 'false']
    },
];

export const toStringConfig: FieldTransformConfig = {
    name: 'toString',
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Converts the input value to a string.  If the input is an array each array item will be converted to a string.',
    examples,
    create({ inputConfig }) {
        if (inputConfig?.field_config.type === FieldType.Date) {
            return toISO8601;
        }

        return toString;
    },
    accepts: [],
    output_type(inputConfig: DataTypeFieldAndChildren): DataTypeFieldAndChildren {
        const { field_config } = inputConfig;

        return {
            field_config: {
                ...field_config,
                type: FieldType.String
            },
        };
    }
};
