import { isURL } from '@terascope/core-utils';
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
        input: 'http://someurl.com.uk',
        output: 'http://someurl.com.uk'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'ftp://someurl.bom:8080?some=bar&hi=bob',
        output: 'ftp://someurl.bom:8080?some=bar&hi=bob'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'http://xn--fsqu00a.xn--3lr804guic',
        output: 'http://xn--fsqu00a.xn--3lr804guic'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'http://example.com/hello%20world',
        output: 'http://example.com/hello%20world'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'bob.com',
        output: 'bob.com'
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'isthis_valid_uri.com',
        output: null
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'http://sthis valid uri.com',
        output: null
    },
    {
        args: {},
        config: { version: 1, fields: { testField: { type: FieldType.String } } },
        field: 'testField',
        input: 'hello://validuri.com',
        output: null
    }
];
export const isURLConfig: FieldValidateConfig = {
    name: 'isURL',
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode.INDIVIDUAL_VALUES,
    category: FunctionDefinitionCategory.STRING,
    description: 'Returns the input if it is a valid url string, otherwise returns null.',
    examples,
    create() {
        return isURL;
    },
    accepts: [FieldType.String]
};
