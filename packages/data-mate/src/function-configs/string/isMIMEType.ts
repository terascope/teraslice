import { isMIMEType } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionExample,
    FunctionDefinitionType, FunctionDefinitionCategory
} from '../interfaces.js';

const examples: FunctionDefinitionExample<Record<string, unknown>>[] = [
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: 'application/javascript',
        output: 'application/javascript'
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: 'text/html',
        output: 'text/html'
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: 'application',
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.String
                }
            }
        },
        field: 'testField',
        input: '',
        output: null
    }
];

export const isMIMETypeConfig: FieldValidateConfig = {
    name: 'isMIMEType',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    examples,
    accepts: [FieldType.String],
    create() {
        return isMIMEType;
    },
    description: 'Returns the input if it is a valid Media or MIME (Multipurpose Internet Mail Extensions) Type, otherwise returns null.',
};
