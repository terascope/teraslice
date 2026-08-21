import { isEmail } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import {
    FieldValidateConfig, ProcessMode, FunctionDefinitionType,
    FunctionDefinitionCategory, FunctionDefinitionExample
} from '../interfaces.js';
import { EMAIL_SQL_PATTERN } from './sql-validator-utils.js';
import { sqlLiteral } from '../sql-helpers.js';

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
        input: 'string@gmail.com',
        output: 'string@gmail.com'
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
        input: 'non.us.email@thing.com.uk',
        output: 'non.us.email@thing.com.uk'
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
        input: 'Abc@def@example.com',
        output: 'Abc@def@example.com'
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
        input: 'cal+henderson@iamcalx.com',
        output: 'cal+henderson@iamcalx.com'
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
        input: 'customer/department=shipping@example.com',
        output: 'customer/department=shipping@example.com'
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
        input: 'user@blah.com/junk.junk?a=<tag value="junk"',
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
        input: 'Abc@def  @  example.com',
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
        input: 'bad email address',
        output: null
    },
    {
        args: {},
        config: {
            version: 1,
            fields: {
                testField: {
                    type: FieldType.Number
                }
            }
        },
        field: 'testField',
        input: 12345,
        output: null
    }
];

export const isEmailConfig: FieldValidateConfig = {
    name: 'isEmail',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a valid email formatted string, otherwise returns null.',
    examples,
    create() {
        return isEmail;
    },
    sql: {
        /**
         * **One regex, and not `validator`'s.** `core-utils`' `isEmail` is a single pattern with no
         * lookaround and no backreference, which RE2 compiles as written - see
         * `EMAIL_SQL_PATTERN`, where the `i` flag is expanded by hand rather than handed to DuckDB.
         *
         * The 173 procedural lines this was declined for are `validator.isEmail`, which nothing in
         * this codebase calls.
        */
        expression: ({ value }) => `regexp_matches(${value}, ${sqlLiteral(EMAIL_SQL_PATTERN)})`,
    },
    accepts: [FieldType.String],
};
