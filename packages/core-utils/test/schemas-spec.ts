import 'jest-extended';
import { AnyObject, Terafoundation } from '@terascope/types';
import { isString } from '../src/strings.js';
import { SchemaValidator } from '../src/index.js';

describe('Schema Object validation', () => {
    function successfulValidation(
        testValues: Record<string, any>[],
        schema: Terafoundation.Schema<any>,
        matchDefault = false
    ) {
        for (const testObj of testValues) {
            const key = Object.keys(testObj)[0];
            const schemaObj = schema[key];

            const testSchema: AnyObject = {};
            testSchema[key] = schemaObj;

            const validator = new SchemaValidator(testSchema, 'successful_test');
            const validatedConfig = validator.validate(testObj);
            expect(validatedConfig).toMatchObject(
                matchDefault ? { [key]: schemaObj.default } : testObj
            );
        }
    }

    function failedValidation(
        testValues: Record<string, any>[],
        schema: Terafoundation.Schema<any>,
        errorMsg?: (key: string, value?: string) => string,
        errorRegex?: RegExp
    ) {
        for (const testObj of testValues) {
            const key = Object.keys(testObj)[0];
            try {
                const schemaObj = schema[key];

                const testSchema: AnyObject = {};
                testSchema[key] = schemaObj;

                const validator = new SchemaValidator(testSchema, 'failed_test');
                validator.validate(testObj);
                throw new Error('Validation should have failed');
            } catch (err) {
                if (errorMsg) {
                    expect((err as Error).message).toContain(errorMsg(key));
                } else if (errorRegex) {
                    expect((err as Error).message).toMatch(errorRegex);
                } else {
                    throw err;
                }
            }
        }
    }
    describe('formats', () => {
        describe('native formats', () => {
            const schema: Terafoundation.Schema<any> = {
                booleanDefaultTrue: {
                    doc: 'test',
                    format: Boolean,
                    default: true
                },
                booleanDefaultFalse: {
                    doc: 'test',
                    format: Boolean,
                    default: false
                },
                booleanDefaultEmptyString: {
                    doc: 'test',
                    format: Boolean,
                    default: ''
                },
                booleanDefaultNull: {
                    doc: 'test',
                    format: Boolean,
                    default: null
                },
                booleanDefaultUndefined: {
                    doc: 'test',
                    format: Boolean,
                    default: undefined
                },
                booleanQuotedDefaultTrue: {
                    doc: 'test',
                    format: 'Boolean',
                    default: true
                },
                booleanQuotedDefaultFalse: {
                    doc: 'test',
                    format: 'Boolean',
                    default: false
                },
                booleanQuotedDefaultEmptyString: {
                    doc: 'test',
                    format: 'Boolean',
                    default: ''
                },
                booleanQuotedDefaultNull: {
                    doc: 'test',
                    format: 'Boolean',
                    default: null
                },
                booleanQuotedDefaultUndefined: {
                    doc: 'test',
                    format: 'Boolean',
                    default: undefined
                },
                stringDefaultEmptyString: {
                    doc: 'test',
                    format: String,
                    default: ''
                },
                stringDefaultValidValue: {
                    doc: 'test',
                    format: String,
                    default: 'valid value'
                },
                stringDefaultInvalidValue: {
                    doc: 'test',
                    format: String,
                    default: true
                },
                stringDefaultNull: {
                    doc: 'test',
                    format: String,
                    default: null
                },
                stringDefaultUndefined: {
                    doc: 'test',
                    format: String,
                    default: undefined
                },
                stringQuotedDefaultEmptyString: {
                    doc: 'test',
                    format: 'String',
                    default: ''
                },
                stringQuotedDefaultValidValue: {
                    doc: 'test',
                    format: 'String',
                    default: 'valid value'
                },
                stringQuotedDefaultInvalidValue: {
                    doc: 'test',
                    format: 'String',
                    default: true
                },
                stringQuotedDefaultNull: {
                    doc: 'test',
                    format: 'String',
                    default: null
                },
                stringQuotedDefaultUndefined: {
                    doc: 'test',
                    format: 'String',
                    default: undefined
                },
                numberDefaultEmptyString: {
                    doc: 'test',
                    format: Number,
                    default: ''
                },
                numberDefaultValidValue: {
                    doc: 'test',
                    format: Number,
                    default: 5
                },
                numberDefaultInvalidValue: {
                    doc: 'test',
                    format: Number,
                    default: true
                },
                numberDefaultNull: {
                    doc: 'test',
                    format: Number,
                    default: null
                },
                numberDefaultUndefined: {
                    doc: 'test',
                    format: Number,
                    default: undefined
                },
                numberQuotedDefaultEmptyString: {
                    doc: 'test',
                    format: 'Number',
                    default: ''
                },
                numberQuotedDefaultValidValue: {
                    doc: 'test',
                    format: 'Number',
                    default: 5
                },
                numberQuotedDefaultInvalidValue: {
                    doc: 'test',
                    format: 'Number',
                    default: true
                },
                numberQuotedDefaultNull: {
                    doc: 'test',
                    format: 'Number',
                    default: null
                },
                numberQuotedDefaultUndefined: {
                    doc: 'test',
                    format: 'Number',
                    default: undefined
                },
                objectDefaultEmptyObject: {
                    doc: 'test',
                    format: Object,
                    default: {}
                },
                objectDefaultValidValue: {
                    doc: 'test',
                    format: Object,
                    default: { foo: 'bar', baz: true }
                },
                objectDefaultInvalidValue: {
                    doc: 'test',
                    format: Object,
                    default: 25
                },
                objectDefaultNull: {
                    doc: 'test',
                    format: Object,
                    default: null
                },
                objectDefaultUndefined: {
                    doc: 'test',
                    format: Object,
                    default: undefined
                },
                objectQuotedDefaultEmptyObject: {
                    doc: 'test',
                    format: 'Object',
                    default: {}
                },
                objectQuotedDefaultValidValue: {
                    doc: 'test',
                    format: 'Object',
                    default: { foo: 'bar', baz: true }
                },
                objectQuotedDefaultInvalidValue: {
                    doc: 'test',
                    format: 'Object',
                    default: 25
                },
                objectQuotedDefaultNull: {
                    doc: 'test',
                    format: 'Object',
                    default: null
                },
                objectQuotedDefaultUndefined: {
                    doc: 'test',
                    format: 'Object',
                    default: undefined
                },
                arrayDefaultEmptyArray: {
                    doc: 'test',
                    format: Array,
                    default: []
                },
                arrayDefaultValidValue: {
                    doc: 'test',
                    format: Array,
                    default: ['foo', 'bar', 'baz']
                },
                arrayDefaultInvalidValue: {
                    doc: 'test',
                    format: Array,
                    default: true
                },
                arrayDefaultNull: {
                    doc: 'test',
                    format: Array,
                    default: null
                },
                arrayDefaultUndefined: {
                    doc: 'test',
                    format: Array,
                    default: undefined
                },
                arrayQuotedDefaultEmptyArray: {
                    doc: 'test',
                    format: 'Array',
                    default: []
                },
                arrayQuotedDefaultValidValue: {
                    doc: 'test',
                    format: 'Array',
                    default: ['foo', 'bar', 'baz']
                },
                arrayQuotedDefaultInvalidValue: {
                    doc: 'test',
                    format: 'Array',
                    default: true
                },
                arrayQuotedDefaultNull: {
                    doc: 'test',
                    format: 'Array',
                    default: null
                },
                arrayQuotedDefaultUndefined: {
                    doc: 'test',
                    format: 'Array',
                    default: undefined
                },
                regExpDefaultEmptyString: {
                    doc: 'test',
                    format: RegExp,
                    default: ''
                },
                regExpDefaultValidValue: {
                    doc: 'test',
                    format: RegExp,
                    default: /.*/
                },
                regExpDefaultInvalidValue: {
                    doc: 'test',
                    format: RegExp,
                    default: true
                },
                regExpDefaultNull: {
                    doc: 'test',
                    format: RegExp,
                    default: null
                },
                regExpDefaultUndefined: {
                    doc: 'test',
                    format: RegExp,
                    default: undefined
                },
                regExpQuotedDefaultEmptyString: {
                    doc: 'test',
                    format: 'RegExp',
                    default: ''
                },
                regExpQuotedDefaultValidValue: {
                    doc: 'test',
                    format: 'RegExp',
                    default: /.*/
                },
                regExpQuotedDefaultInvalidValue: {
                    doc: 'test',
                    format: 'RegExp',
                    default: true
                },
                regExpQuotedDefaultNull: {
                    doc: 'test',
                    format: 'RegExp',
                    default: null
                },
                regExpQuotedDefaultUndefined: {
                    doc: 'test',
                    format: 'RegExp',
                    default: undefined
                },
            };

            describe('valid inputs', () => {
                it('should return valid configs if default valid or undefined', () => {
                    const testValues = [
                        { booleanDefaultTrue: false },
                        { booleanDefaultFalse: false },
                        { booleanDefaultNull: false },
                        { booleanDefaultUndefined: false },
                        { booleanQuotedDefaultTrue: false },
                        { booleanQuotedDefaultFalse: false },
                        { booleanQuotedDefaultNull: false },
                        { booleanQuotedDefaultUndefined: false },
                        { stringDefaultEmptyString: 'some string' },
                        { stringDefaultValidValue: 'some string' },
                        { stringDefaultNull: 'some string' },
                        { stringDefaultUndefined: 'some string' },
                        { stringQuotedDefaultEmptyString: 'some string' },
                        { stringQuotedDefaultValidValue: 'some string' },
                        { stringQuotedDefaultNull: 'some string' },
                        { stringQuotedDefaultUndefined: 'some string' },
                        { numberDefaultValidValue: 10.5 },
                        { numberDefaultNull: 10.5 },
                        { numberDefaultUndefined: 10.5 },
                        { numberQuotedDefaultValidValue: 10.5 },
                        { numberQuotedDefaultNull: 10.5 },
                        { numberQuotedDefaultUndefined: 10.5 },
                        { objectDefaultEmptyObject: { key: 'value' } },
                        { objectDefaultValidValue: { key: 'value' } },
                        { objectDefaultNull: { key: 'value' } },
                        { objectDefaultUndefined: { key: 'value' } },
                        { objectQuotedDefaultEmptyObject: { key: 'value' } },
                        { objectQuotedDefaultValidValue: { key: 'value' } },
                        { objectQuotedDefaultNull: { key: 'value' } },
                        { objectQuotedDefaultUndefined: { key: 'value' } },
                        { arrayDefaultEmptyArray: [5, 10, 23.4] },
                        { arrayDefaultValidValue: [5, 10, 23.4] },
                        { arrayDefaultNull: [5, 10, 23.4] },
                        { arrayDefaultUndefined: [5, 10, 23.4] },
                        { arrayQuotedDefaultEmptyArray: [5, 10, 23.4] },
                        { arrayQuotedDefaultValidValue: [5, 10, 23.4] },
                        { arrayQuotedDefaultNull: [5, 10, 23.4] },
                        { arrayQuotedDefaultUndefined: [5, 10, 23.4] },
                        { regExpDefaultValidValue: /<(.*?)>/ },
                        { regExpDefaultNull: /<(.*?)>/ },
                        { regExpDefaultUndefined: /<(.*?)>/ },
                        { regExpQuotedDefaultValidValue: /<(.*?)>/ },
                        { regExpQuotedDefaultNull: /<(.*?)>/ },
                        { regExpQuotedDefaultUndefined: /<(.*?)>/ },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema);
                });

                it('invalid defaults should fail validation', () => {
                    const testValues = [
                        { booleanDefaultEmptyString: false },
                        { booleanQuotedDefaultEmptyString: false },
                        { stringDefaultInvalidValue: 'some string' },
                        { stringQuotedDefaultInvalidValue: 'some string' },
                        { numberDefaultEmptyString: 10.5 },
                        { numberDefaultInvalidValue: 10.5 },
                        { numberQuotedDefaultEmptyString: 10.5 },
                        { numberQuotedDefaultInvalidValue: 10.5 },
                        { objectDefaultInvalidValue: { key: 'value' } },
                        { objectQuotedDefaultInvalidValue: { key: 'value' } },
                        { arrayDefaultInvalidValue: [5, 10, 23.4] },
                        { arrayQuotedDefaultInvalidValue: [5, 10, 23.4] },
                        { regExpDefaultEmptyString: /<(.*?)>/ },
                        { regExpDefaultInvalidValue: /<(.*?)>/ },
                        { regExpQuotedDefaultEmptyString: /<(.*?)>/ },
                        { regExpQuotedDefaultInvalidValue: /<(.*?)>/ },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                });
            });

            describe('null inputs', () => {
                describe('Booleans', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { booleanDefaultTrue: null },
                            { booleanDefaultFalse: null },
                            { booleanDefaultNull: null },
                            { booleanDefaultUndefined: null },
                            { booleanQuotedDefaultTrue: null },
                            { booleanQuotedDefaultFalse: null },
                            { booleanQuotedDefaultNull: null },
                            { booleanQuotedDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected boolean');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { booleanDefaultEmptyString: null },
                            { booleanQuotedDefaultEmptyString: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('Strings', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { stringDefaultEmptyString: null },
                            { stringDefaultValidValue: null },
                            { stringDefaultNull: null },
                            { stringDefaultUndefined: null },
                            { stringQuotedDefaultEmptyString: null },
                            { stringQuotedDefaultValidValue: null },
                            { stringQuotedDefaultNull: null },
                            { stringQuotedDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected string');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { stringDefaultInvalidValue: null },
                            { stringQuotedDefaultInvalidValue: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('Numbers', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { numberDefaultValidValue: null },
                            { numberDefaultNull: null },
                            { numberDefaultUndefined: null },
                            { numberQuotedDefaultValidValue: null },
                            { numberQuotedDefaultNull: null },
                            { numberQuotedDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { numberDefaultEmptyString: null },
                            { numberDefaultInvalidValue: null },
                            { numberQuotedDefaultEmptyString: null },
                            { numberQuotedDefaultInvalidValue: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('Objects', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { objectDefaultEmptyObject: null },
                            { objectDefaultValidValue: null },
                            { objectDefaultNull: null },
                            { objectDefaultUndefined: null },
                            { objectQuotedDefaultEmptyObject: null },
                            { objectQuotedDefaultValidValue: null },
                            { objectQuotedDefaultNull: null },
                            { objectQuotedDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected record');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { objectDefaultInvalidValue: null },
                            { objectQuotedDefaultInvalidValue: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('Arrays', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { arrayDefaultEmptyArray: null },
                            { arrayDefaultValidValue: null },
                            { arrayDefaultNull: null },
                            { arrayDefaultUndefined: null },
                            { arrayQuotedDefaultEmptyArray: null },
                            { arrayQuotedDefaultValidValue: null },
                            { arrayQuotedDefaultNull: null },
                            { arrayQuotedDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected array');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { arrayDefaultInvalidValue: null },
                            { arrayQuotedDefaultInvalidValue: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('RegExp', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { regExpDefaultValidValue: null },
                            { regExpDefaultNull: null },
                            { regExpDefaultUndefined: null },
                            { regExpQuotedDefaultValidValue: null },
                            { regExpQuotedDefaultUndefined: null },
                            { regExpQuotedDefaultNull: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Input not instance of RegExp');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { regExpDefaultEmptyString: null },
                            { regExpDefaultInvalidValue: null },
                            { regExpQuotedDefaultEmptyString: null },
                            { regExpQuotedDefaultInvalidValue: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });
            });

            describe('undefined inputs', () => {
                describe('Booleans', () => {
                    it('will throw on bad default', () => {
                        const testValues = [
                            { booleanDefaultEmptyString: undefined },
                            { booleanQuotedDefaultEmptyString: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });

                    it('should use valid, null, or undefined defaults', async () => {
                        const testValues = [
                            { booleanDefaultTrue: undefined },
                            { booleanDefaultFalse: undefined },
                            { booleanDefaultNull: undefined },
                            { booleanDefaultUndefined: undefined },
                            { booleanQuotedDefaultTrue: undefined },
                            { booleanQuotedDefaultFalse: undefined },
                            { booleanQuotedDefaultNull: undefined },
                            { booleanQuotedDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });
                });

                describe('Strings', () => {
                    it('will throw on bad default', () => {
                        const testValues = [
                            { stringDefaultInvalidValue: undefined },
                            { stringQuotedDefaultInvalidValue: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });

                    it('should use valid, null, or undefined defaults', async () => {
                        const testValues = [
                            { stringDefaultEmptyString: undefined },
                            { stringDefaultValidValue: undefined },
                            { stringDefaultNull: undefined },
                            { stringDefaultUndefined: undefined },
                            { stringQuotedDefaultEmptyString: undefined },
                            { stringQuotedDefaultValidValue: undefined },
                            { stringQuotedDefaultNull: undefined },
                            { stringQuotedDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });
                });

                describe('Numbers', () => {
                    it('will throw on bad default', () => {
                        const testValues = [
                            { numberDefaultEmptyString: undefined },
                            { numberDefaultInvalidValue: undefined },
                            { numberQuotedDefaultEmptyString: undefined },
                            { numberQuotedDefaultInvalidValue: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });

                    it('should use valid, null, or undefined defaults', async () => {
                        const testValues = [
                            { numberDefaultValidValue: undefined },
                            { numberDefaultNull: undefined },
                            { numberDefaultUndefined: undefined },
                            { numberQuotedDefaultValidValue: undefined },
                            { numberQuotedDefaultNull: undefined },
                            { numberQuotedDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });
                });

                describe('Objects', () => {
                    it('will throw on bad default', () => {
                        const testValues = [
                            { objectDefaultInvalidValue: undefined },
                            { objectQuotedDefaultInvalidValue: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });

                    it('should use valid, null, or undefined defaults', async () => {
                        const testValues = [
                            { objectDefaultEmptyObject: undefined },
                            { objectDefaultValidValue: undefined },
                            { objectDefaultNull: undefined },
                            { objectDefaultUndefined: undefined },
                            { objectQuotedDefaultEmptyObject: undefined },
                            { objectQuotedDefaultValidValue: undefined },
                            { objectQuotedDefaultNull: undefined },
                            { objectQuotedDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });
                });

                describe('Arrays', () => {
                    it('will throw on bad default', () => {
                        const testValues = [
                            { arrayDefaultInvalidValue: undefined },
                            { arrayQuotedDefaultInvalidValue: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });

                    it('should use valid, null, or undefined defaults', async () => {
                        const testValues = [
                            { arrayDefaultEmptyArray: undefined },
                            { arrayDefaultValidValue: undefined },
                            { arrayDefaultNull: undefined },
                            { arrayDefaultUndefined: undefined },
                            { arrayQuotedDefaultEmptyArray: undefined },
                            { arrayQuotedDefaultValidValue: undefined },
                            { arrayQuotedDefaultNull: undefined },
                            { arrayQuotedDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });
                });

                describe('RegExp', () => {
                    it('will throw on bad default', () => {
                        const testValues = [
                            { regExpDefaultEmptyString: undefined },
                            { regExpDefaultInvalidValue: undefined },
                            { regExpQuotedDefaultEmptyString: undefined },
                            { regExpQuotedDefaultInvalidValue: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });

                    it('should use valid, null, or undefined defaults', async () => {
                        const testValues = [
                            { regExpDefaultValidValue: undefined },
                            { regExpDefaultNull: undefined },
                            { regExpDefaultUndefined: undefined },
                            { regExpQuotedDefaultValidValue: undefined },
                            { regExpQuotedDefaultNull: undefined },
                            { regExpQuotedDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });
                });
            });

            describe('empty string inputs', () => {
                describe('Booleans', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { booleanDefaultTrue: '' },
                            { booleanDefaultFalse: '' },
                            { booleanDefaultNull: '' },
                            { booleanDefaultUndefined: '' },
                            { booleanQuotedDefaultTrue: '' },
                            { booleanQuotedDefaultFalse: '' },
                            { booleanQuotedDefaultNull: '' },
                            { booleanQuotedDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected boolean, received string');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { booleanDefaultEmptyString: '' },
                            { booleanQuotedDefaultEmptyString: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('Strings', () => {
                    it('will throw on bad default', () => {
                        const testValues = [
                            { stringDefaultInvalidValue: '' },
                            { stringQuotedDefaultInvalidValue: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                    it('should accept empty string', () => {
                        const testValues = [
                            { stringDefaultEmptyString: '' },
                            { stringDefaultValidValue: '' },
                            { stringDefaultNull: '' },
                            { stringDefaultUndefined: '' },
                            { stringQuotedDefaultEmptyString: '' },
                            { stringQuotedDefaultValidValue: '' },
                            { stringQuotedDefaultNull: '' },
                            { stringQuotedDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });
                });

                describe('Numbers', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { numberDefaultValidValue: '' },
                            { numberDefaultNull: '' },
                            { numberDefaultUndefined: '' },
                            { numberQuotedDefaultValidValue: '' },
                            { numberQuotedDefaultNull: '' },
                            { numberQuotedDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { numberDefaultEmptyString: '' },
                            { numberDefaultInvalidValue: '' },
                            { numberQuotedDefaultEmptyString: '' },
                            { numberQuotedDefaultInvalidValue: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('Objects', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { objectDefaultEmptyObject: '' },
                            { objectDefaultValidValue: '' },
                            { objectDefaultNull: '' },
                            { objectDefaultUndefined: '' },
                            { objectQuotedDefaultEmptyObject: '' },
                            { objectQuotedDefaultValidValue: '' },
                            { objectQuotedDefaultNull: '' },
                            { objectQuotedDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected record, received string');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { objectDefaultInvalidValue: '' },
                            { objectQuotedDefaultInvalidValue: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('Arrays', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { arrayDefaultEmptyArray: '' },
                            { arrayDefaultValidValue: '' },
                            { arrayDefaultNull: '' },
                            { arrayDefaultUndefined: '' },
                            { arrayQuotedDefaultEmptyArray: '' },
                            { arrayQuotedDefaultValidValue: '' },
                            { arrayQuotedDefaultNull: '' },
                            { arrayQuotedDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected array');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { arrayDefaultInvalidValue: '' },
                            { arrayQuotedDefaultInvalidValue: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('RegExp', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { regExpDefaultValidValue: '' },
                            { regExpDefaultNull: '' },
                            { regExpDefaultUndefined: '' },
                            { regExpQuotedDefaultValidValue: '' },
                            { regExpQuotedDefaultNull: '' },
                            { regExpQuotedDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Input not instance of RegExp');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { regExpDefaultEmptyString: '' },
                            { regExpDefaultInvalidValue: '' },
                            { regExpQuotedDefaultEmptyString: '' },
                            { regExpQuotedDefaultInvalidValue: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });
            });
        });

        describe('predefined formats', () => {
            const schema = {
                asteriskDefaultTrue: {
                    doc: 'test',
                    format: '*',
                    default: true
                },
                asteriskDefaultFalse: {
                    doc: 'test',
                    format: '*',
                    default: false
                },
                asteriskDefaultEmptyString: {
                    doc: 'test',
                    format: '*',
                    default: ''
                },
                asteriskDefaultNull: {
                    doc: 'test',
                    format: '*',
                    default: null
                },
                asteriskDefaultUndefined: {
                    doc: 'test',
                    format: '*',
                    default: undefined
                },
                intDefaultValidValue: {
                    doc: 'test',
                    format: 'int',
                    default: 25
                },
                intDefaultInvalidValue: {
                    doc: 'test',
                    format: 'int',
                    default: 0.5
                },
                intDefaultEmptyString: {
                    doc: 'test',
                    format: 'int',
                    default: ''
                },
                intDefaultNull: {
                    doc: 'test',
                    format: 'int',
                    default: null
                },
                intDefaultUndefined: {
                    doc: 'test',
                    format: 'int',
                    default: undefined
                },
                portDefaultValidValue: {
                    doc: 'test',
                    format: 'port',
                    default: 8000
                },
                portDefaultInvalidValue: {
                    doc: 'test',
                    format: 'port',
                    default: 70000
                },
                portDefaultEmptyString: {
                    doc: 'test',
                    format: 'port',
                    default: ''
                },
                portDefaultNull: {
                    doc: 'test',
                    format: 'port',
                    default: null
                },
                portDefaultUndefined: {
                    doc: 'test',
                    format: 'port',
                    default: undefined
                },
                natDefaultValidValue: {
                    doc: 'test',
                    format: 'nat',
                    default: 20
                },
                natDefaultInvalidValue: {
                    doc: 'test',
                    format: 'nat',
                    default: -3.5
                },
                natDefaultEmptyString: {
                    doc: 'test',
                    format: 'nat',
                    default: ''
                },
                natDefaultNull: {
                    doc: 'test',
                    format: 'nat',
                    default: null
                },
                natDefaultUndefined: {
                    doc: 'test',
                    format: 'nat',
                    default: undefined
                },
                urlDefaultValidValue: {
                    doc: 'test',
                    format: 'url',
                    default: 'https://www.example.com'
                },
                urlDefaultInvalidValue: {
                    doc: 'test',
                    format: 'url',
                    default: 500
                },
                urlDefaultEmptyString: {
                    doc: 'test',
                    format: 'url',
                    default: ''
                },
                urlDefaultNull: {
                    doc: 'test',
                    format: 'url',
                    default: null
                },
                urlDefaultUndefined: {
                    doc: 'test',
                    format: 'url',
                    default: undefined
                },
                emailDefaultValidValue: {
                    doc: 'test',
                    format: 'email',
                    default: 'hello@example.com'
                },
                emailDefaultInvalidValue: {
                    doc: 'test',
                    format: 'email',
                    default: 500
                },
                emailDefaultEmptyString: {
                    doc: 'test',
                    format: 'email',
                    default: ''
                },
                emailDefaultNull: {
                    doc: 'test',
                    format: 'email',
                    default: null
                },
                emailDefaultUndefined: {
                    doc: 'test',
                    format: 'email',
                    default: undefined
                },
                ipAddressDefaultValidValue: {
                    doc: 'test',
                    format: 'ipaddress',
                    default: '192.168.0.1'
                },
                ipAddressDefaultInvalidValue: {
                    doc: 'test',
                    format: 'ipaddress',
                    default: 500
                },
                ipAddressDefaultEmptyString: {
                    doc: 'test',
                    format: 'ipaddress',
                    default: ''
                },
                ipAddressDefaultNull: {
                    doc: 'test',
                    format: 'ipaddress',
                    default: null
                },
                ipAddressDefaultUndefined: {
                    doc: 'test',
                    format: 'ipaddress',
                    default: undefined
                },
            };

            describe('valid inputs', () => {
                it('should return valid configs if default valid, null or undefined', () => {
                    const testValues = [
                        { asteriskDefaultTrue: 'hello' },
                        { asteriskDefaultFalse: 'hello' },
                        { asteriskDefaultEmptyString: 'hello' },
                        { asteriskDefaultNull: 'hello' },
                        { asteriskDefaultUndefined: 'hello' },
                        { intDefaultValidValue: -7 },
                        { intDefaultNull: -7 },
                        { intDefaultUndefined: -7 },
                        { portDefaultValidValue: 9000 },
                        { natDefaultNull: 5 },
                        { portDefaultNull: 9000 },
                        { portDefaultUndefined: 9000 },
                        { natDefaultValidValue: 5 },
                        { natDefaultUndefined: 5 },
                        { urlDefaultValidValue: 'http://example.com' },
                        { urlDefaultNull: 'http://example.com' },
                        { urlDefaultUndefined: 'http://example.com' },
                        { emailDefaultValidValue: 'goodbye@example.com' },
                        { emailDefaultNull: 'goodbye@example.com' },
                        { emailDefaultUndefined: 'goodbye@example.com' },
                        { ipAddressDefaultValidValue: '72.156.20.4' },
                        { ipAddressDefaultNull: '72.156.20.4' },
                        { ipAddressDefaultUndefined: '72.156.20.4' },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema);
                });

                it('invalid defaults should fail validation', () => {
                    const testValues = [
                        { intDefaultInvalidValue: -7 },
                        { intDefaultEmptyString: -7 },
                        { portDefaultInvalidValue: 9000 },
                        { portDefaultEmptyString: 9000 },
                        { natDefaultInvalidValue: 5 },
                        { natDefaultEmptyString: 5 },
                        { urlDefaultInvalidValue: 'http://example.com' },
                        { urlDefaultEmptyString: 'http://example.com' },
                        { emailDefaultInvalidValue: 'goodbye@example.com' },
                        { emailDefaultEmptyString: 'goodbye@example.com' },
                        { ipAddressDefaultInvalidValue: '72.156.20.4' },
                        { ipAddressDefaultEmptyString: '72.156.20.4' },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                });
            });

            describe('null inputs', () => {
                describe('asterisk', () => {
                    it('will accept null', () => {
                        const testValues = [
                            { asteriskDefaultTrue: null },
                            { asteriskDefaultFalse: null },
                            { asteriskDefaultEmptyString: null },
                            { asteriskDefaultNull: null },
                            { asteriskDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });
                });

                describe('int', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { intDefaultValidValue: null },
                            { intDefaultNull: null },
                            { intDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received null');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { intDefaultInvalidValue: null },
                            { intDefaultEmptyString: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('port', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { portDefaultValidValue: null },
                            { portDefaultNull: null },
                            { portDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Too small: expected number to be >=1');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { portDefaultInvalidValue: null },
                            { portDefaultEmptyString: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('nat', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { natDefaultValidValue: null },
                            { natDefaultNull: null },
                            { natDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received null');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { natDefaultInvalidValue: null },
                            { natDefaultEmptyString: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('url', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { urlDefaultValidValue: null },
                            { urlDefaultNull: null },
                            { urlDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected string, received null');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { urlDefaultInvalidValue: null },
                            { urlDefaultEmptyString: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('email', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { emailDefaultValidValue: null },
                            { emailDefaultNull: null },
                            { emailDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected string, received null');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { emailDefaultInvalidValue: null },
                            { emailDefaultEmptyString: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('ipaddress', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { ipAddressDefaultValidValue: null },
                            { ipAddressDefaultNull: null },
                            { ipAddressDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected string, received null');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { ipAddressDefaultInvalidValue: null },
                            { ipAddressDefaultEmptyString: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });
            });

            describe('undefined inputs', () => {
                describe('asterisk', () => {
                    it('will treat undefined as missing and use the default', () => {
                        const testValues = [
                            { asteriskDefaultTrue: undefined },
                            { asteriskDefaultFalse: undefined },
                            { asteriskDefaultEmptyString: undefined },
                            { asteriskDefaultNull: undefined },
                            { asteriskDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });
                });

                describe('int', () => {
                    it('will accept a valid, null, or undefined default', () => {
                        const testValues = [
                            { intDefaultValidValue: undefined },
                            { intDefaultNull: undefined },
                            { intDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { intDefaultInvalidValue: undefined },
                            { intDefaultEmptyString: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('port', () => {
                    it('will accept a valid, null, or undefined default', () => {
                        const testValues = [
                            { portDefaultValidValue: undefined },
                            { portDefaultNull: undefined },
                            { portDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { portDefaultInvalidValue: undefined },
                            { portDefaultEmptyString: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('nat', () => {
                    it('will accept a valid default', () => {
                        const testValues = [
                            { natDefaultValidValue: undefined },
                            { natDefaultNull: undefined },
                            { natDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { natDefaultInvalidValue: undefined },
                            { natDefaultEmptyString: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('url', () => {
                    it('will accept a valid, null, or undefined default', () => {
                        const testValues = [
                            { urlDefaultValidValue: undefined },
                            { urlDefaultNull: undefined },
                            { urlDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { urlDefaultInvalidValue: undefined },
                            { urlDefaultEmptyString: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('email', () => {
                    it('will accept a valid, null, or undefined default', () => {
                        const testValues = [
                            { emailDefaultValidValue: undefined },
                            { emailDefaultNull: undefined },
                            { emailDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { emailDefaultInvalidValue: undefined },
                            { emailDefaultEmptyString: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('ipaddress', () => {
                    it('will accept a valid, null, or undefined default', () => {
                        const testValues = [
                            { ipAddressDefaultValidValue: undefined },
                            { ipAddressDefaultUndefined: undefined },
                            { ipAddressDefaultNull: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema, true);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { ipAddressDefaultInvalidValue: undefined },
                            { ipAddressDefaultEmptyString: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });
            });

            describe('empty string inputs', () => {
                describe('asterisk', () => {
                    it('will accept empty string', () => {
                        const testValues = [
                            { asteriskDefaultTrue: '' },
                            { asteriskDefaultFalse: '' },
                            { asteriskDefaultEmptyString: '' },
                            { asteriskDefaultNull: '' },
                            { asteriskDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });
                });

                describe('int', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { intDefaultValidValue: '' },
                            { intDefaultUndefined: '' },
                            { intDefaultNull: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received string');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { intDefaultInvalidValue: '' },
                            { intDefaultEmptyString: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('port', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { portDefaultValidValue: '' },
                            { portDefaultUndefined: '' },
                            { portDefaultNull: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Too small: expected number to be >=1');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { portDefaultInvalidValue: '' },
                            { portDefaultEmptyString: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('nat', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { intDefaultValidValue: '' },
                            { natDefaultUndefined: '' },
                            { natDefaultNull: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received string');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { natDefaultInvalidValue: '' },
                            { natDefaultEmptyString: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('url', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { urlDefaultValidValue: '' },
                            { urlDefaultUndefined: '' },
                            { urlDefaultNull: '' },
                        ];
                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid URL');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { urlDefaultInvalidValue: '' },
                            { urlDefaultEmptyString: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('email', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { emailDefaultValidValue: '' },
                            { emailDefaultUndefined: '' },
                            { emailDefaultNull: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid email address');
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { emailDefaultInvalidValue: '' },
                            { emailDefaultEmptyString: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });

                describe('ipaddress', () => {
                    it('will throw on bad value', () => {
                        const testValues = [
                            { ipAddressDefaultValidValue: '' },
                            { ipAddressDefaultUndefined: '' },
                            { ipAddressDefaultNull: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(
                            testValues,
                            schema,
                            undefined,
                            /(?=.*Invalid IPv4 address)(?=.*Invalid IPv6 address)/s
                        );
                    });

                    it('will throw on bad default', () => {
                        const testValues = [
                            { ipAddressDefaultInvalidValue: '' },
                            { ipAddressDefaultEmptyString: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `Invalid default value for key ${key}`);
                    });
                });
            });
        });

        describe('inline formats', () => {
            const inlineFormatFn = (val: unknown): void => {
                if (!isString(val)) {
                    throw new Error('if parameter is defined it must be a string');
                }
            };

            const schema = {
                inlineFunctionDefaultValidValue: {
                    doc: 'test',
                    format: inlineFormatFn,
                    default: 'goodbye'
                },
                inlineFunctionDefaultNull: {
                    doc: 'test',
                    format: inlineFormatFn,
                    default: null
                },
                inlineFunctionDefaultUndefined: {
                    doc: 'test',
                    format: inlineFormatFn,
                    default: undefined
                },
                inlineFunctionDefaultEmptyString: {
                    doc: 'test',
                    format: inlineFormatFn,
                    default: ''
                },
                inlineFunctionDefaultInvalidBoolean: {
                    doc: 'test',
                    format: inlineFormatFn,
                    default: false
                },
                inlineFunctionDefaultInvalidNumber: {
                    doc: 'test',
                    format: inlineFormatFn,
                    default: 25
                },
                inlineFunctionDefaultInvalidObject: {
                    doc: 'test',
                    format: inlineFormatFn,
                    default: { hello: 'world' }
                },
                inlineFunctionDefaultInvalidArray: {
                    doc: 'test',
                    format: inlineFormatFn,
                    default: [1, 2, 3]
                },
            };

            describe('valid inputs and valid defaults', () => {
                it('should return valid configs', () => {
                    const testValues = [
                        { inlineFunctionDefaultValidValue: 'hello' },
                        { inlineFunctionDefaultEmptyString: 'hello' },
                        { inlineFunctionDefaultNull: 'hello' },
                        { inlineFunctionDefaultUndefined: 'hello' },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema);
                });
            });

            describe('valid inputs, but invalid defaults', () => {
                it('default not run against format fn, so should return valid configs', () => {
                    const testValues = [
                        { inlineFunctionDefaultInvalidBoolean: 'hello' },
                        { inlineFunctionDefaultInvalidNumber: 'hello' },
                        { inlineFunctionDefaultInvalidObject: 'hello' },
                        { inlineFunctionDefaultInvalidArray: 'hello' },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema);
                });
            });

            describe('null inputs', () => {
                it('will fail validation for invalid default', () => {
                    const testValues = [
                        { inlineFunctionDefaultNull: null },
                        { inlineFunctionDefaultUndefined: null },
                        { inlineFunctionDefaultInvalidBoolean: null },
                        { inlineFunctionDefaultInvalidNumber: null },
                        { inlineFunctionDefaultInvalidObject: null },
                        { inlineFunctionDefaultInvalidArray: null },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues, schema, () => 'if parameter is defined it must be a string');
                });

                it('will return valid config for valid default value', () => {
                    const testValues = [
                        { inlineFunctionDefaultValidValue: null },
                        { inlineFunctionDefaultEmptyString: null },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema);
                });
            });

            describe('undefined inputs', () => {
                it('will fail validation for invalid default', () => {
                    const testValues1 = [
                        { inlineFunctionDefaultNull: undefined },
                        { inlineFunctionDefaultUndefined: undefined },
                        { inlineFunctionDefaultInvalidBoolean: undefined },
                        { inlineFunctionDefaultInvalidNumber: undefined },
                        { inlineFunctionDefaultInvalidObject: undefined },
                        { inlineFunctionDefaultInvalidArray: undefined },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues1, schema, () => 'if parameter is defined it must be a string');
                });

                it('will return valid config for valid default value', () => {
                    const testValues = [
                        { inlineFunctionDefaultEmptyString: undefined },
                        { inlineFunctionDefaultValidValue: undefined },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema, true);
                });
            });

            describe('empty string inputs', () => {
                it('will accept empty string if valid for function', () => {
                    const testValues = [
                        { inlineFunctionDefaultValidValue: '' },
                        { inlineFunctionDefaultEmptyString: '' },
                        { inlineFunctionDefaultNull: '' },
                        { inlineFunctionDefaultUndefined: '' },
                        { inlineFunctionDefaultInvalidBoolean: '' },
                        { inlineFunctionDefaultInvalidNumber: '' },
                        { inlineFunctionDefaultInvalidObject: '' },
                        { inlineFunctionDefaultInvalidArray: '' },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema);
                });
            });

            describe('no property set', () => {
                describe('will use default if key not defined', () => {
                    it('defaults that are valid will successfully validate', () => {
                        const validDefaultKeys = [
                            'inlineFunctionDefaultValidValue',
                            'inlineFunctionDefaultEmptyString',
                        ];

                        for (const key of validDefaultKeys) {
                            const schemaObj = schema[key as keyof typeof schema];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'no_property_test');
                            const validatedConfig = validator.validate({});
                            expect(validatedConfig).toMatchObject({ [key]: schemaObj.default });
                        }
                    });

                    it('invalid default will fail', () => {
                        const invalidDefaultKeys = [
                            'inlineFunctionDefaultNull',
                            'inlineFunctionDefaultUndefined',
                            'inlineFunctionDefaultInvalidBoolean',
                            'inlineFunctionDefaultInvalidNumber',
                            'inlineFunctionDefaultInvalidObject',
                            'inlineFunctionDefaultInvalidArray',
                        ];

                        for (const key of invalidDefaultKeys) {
                            try {
                                const schemaObj = schema[key as keyof typeof schema];

                                const testSchema: AnyObject = {};
                                testSchema[key] = schemaObj;

                                const validator = new SchemaValidator(testSchema, 'no_property_test');
                                validator.validate({});
                                throw new Error('Validation should have failed');
                            } catch (err) {
                                expect((err as Error).message).toContain('if parameter is defined it must be a string');
                            }
                        }
                    });
                });
            });
        });
    });

    describe('args and env vars', () => {
        const schema: Terafoundation.Schema<any> = {
            argAndEnvDefined: {
                doc: 'test',
                format: String,
                default: 'default value',
                env: 'TEST_ENV1',
                arg: 'testArg1'
            },
            argDefined: {
                doc: 'test',
                format: String,
                default: 'default value',
                arg: 'testArg2'
            },
            envDefined: {
                doc: 'test',
                format: String,
                default: 'default value',
                env: 'TEST_ENV2',
            },
            neitherDefined: {
                doc: 'test',
                format: String,
                default: 'default value',
            },
            argInSchemaButNotDefined: {
                doc: 'test',
                format: String,
                default: 'default value',
                arg: 'testArg3'
            },
            envInSchemaButNotDefined: {
                doc: 'test',
                format: String,
                default: 'default value',
                env: 'TEST_ENV3',
            },
        };

        const originalArgv = process.argv;

        beforeEach(() => {
            process.argv = ['node', 'jest'];
            process.argv.push('testArg1', 'argValue1');
            process.argv.push('testArg2', 'argValue2');

            process.env.TEST_ENV1 = 'envValue1';
            process.env.TEST_ENV2 = 'envValue2';
        });

        afterEach(() => {
            process.argv = originalArgv;
            delete process.env.TEST_ENV1;
            delete process.env.TEST_ENV2;
        });

        describe('should return highest precedence values', () => {
            it('with valid loaded config values', () => {
                const testValues = {
                    argAndEnvDefined: 'loaded value from config',
                    argDefined: 'loaded value from config',
                    envDefined: 'loaded value from config',
                    neitherDefined: 'loaded value from config',
                    argInSchemaButNotDefined: 'loaded value from config',
                    envInSchemaButNotDefined: 'loaded value from config',
                };

                const convertedValues = {
                    argAndEnvDefined: 'argValue1',
                    argDefined: 'argValue2',
                    envDefined: 'envValue2',
                    neitherDefined: 'loaded value from config',
                    argInSchemaButNotDefined: 'loaded value from config',
                    envInSchemaButNotDefined: 'loaded value from config',
                };

                const validator = new SchemaValidator(schema, 'precedence_test');
                const validatedConfig = validator.validate(testValues);
                expect(validatedConfig).toMatchObject(convertedValues);
            });

            it('with empty string loaded config value', () => {
                const testValues = {
                    argAndEnvDefined: '',
                    argDefined: '',
                    envDefined: '',
                    neitherDefined: '',
                    argInSchemaButNotDefined: '',
                    envInSchemaButNotDefined: '',
                };

                const convertedValues = {
                    argAndEnvDefined: 'argValue1',
                    argDefined: 'argValue2',
                    envDefined: 'envValue2',
                    neitherDefined: '',
                    argInSchemaButNotDefined: '',
                    envInSchemaButNotDefined: '',
                };

                const validator = new SchemaValidator(schema, 'precedence_test');
                const validatedConfig = validator.validate(testValues);
                expect(validatedConfig).toMatchObject(convertedValues);
            });

            it('with null loaded config value', () => {
                const testValues1 = {
                    argAndEnvDefined: null,
                    argDefined: null,
                    envDefined: null,
                };

                const testValues2 = {
                    neitherDefined: null,
                    argInSchemaButNotDefined: null,
                    envInSchemaButNotDefined: null,
                };

                const convertedValues1 = {
                    argAndEnvDefined: 'argValue1',
                    argDefined: 'argValue2',
                    envDefined: 'envValue2',
                };

                const validator = new SchemaValidator(schema, 'precedence_test');
                const validatedConfig1 = validator.validate(testValues1);
                expect(validatedConfig1).toMatchObject(convertedValues1);

                expect(() => validator.validate(testValues2)).toThrow('Invalid input: expected string, received null');
            });

            it('with undefined loaded config value', () => {
                const testValues = {
                    argAndEnvDefined: undefined,
                    argDefined: undefined,
                    envDefined: undefined,
                    neitherDefined: undefined,
                };

                const convertedValues = {
                    argAndEnvDefined: 'argValue1',
                    argDefined: 'argValue2',
                    envDefined: 'envValue2',
                    neitherDefined: 'default value'
                };

                const validator = new SchemaValidator(schema, 'precedence_test');
                const validatedConfig = validator.validate(testValues);
                expect(validatedConfig).toMatchObject(convertedValues);
            });

            it('with empty object config', () => {
                const testValues = {};

                const convertedValues = {
                    argAndEnvDefined: 'argValue1',
                    argDefined: 'argValue2',
                    envDefined: 'envValue2',
                    neitherDefined: 'default value'
                };

                const validator = new SchemaValidator(schema, 'precedence_test');
                const validatedConfig = validator.validate(testValues);
                expect(validatedConfig).toMatchObject(convertedValues);
            });
        });
    });
});
