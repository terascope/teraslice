import 'jest-extended';
// import convict from 'convict';
import { AnyObject } from 'packages/types/dist/src/utility';
// @ ts-expect-error no types
// import convict_format_with_validator from 'convict-format-with-validator';
import { isString } from '../src/strings.js';
import { Schema, SchemaValidator } from '../src';

// convict.addFormats(convict_format_with_validator);

describe('Schema Object validation', () => {
    function successfulValidation(
        testValues: Record<string, any>[],
        schema: Schema<any>
    ) {
        for (const testObj of testValues) {
            const key = Object.keys(testObj)[0];
            const schemaObj = schema[key];

            const testSchema: AnyObject = {};
            testSchema[key] = schemaObj;

            const validator = new SchemaValidator(testSchema, 'test');
            const validatedConfig = validator.validate(testObj);
            expect(validatedConfig).toMatchObject(testObj);
        }
    }

    function failedValidation(
        testValues: Record<string, any>[],
        schema: Schema<any>,
        errorMsg?: (key: string) => string,
        errorRegex?: RegExp
    ) {
        for (const testObj of testValues) {
            try {
                const key = Object.keys(testObj)[0];
                const schemaObj = schema[key];

                const testSchema: AnyObject = {};
                testSchema[key] = schemaObj;

                const validator = new SchemaValidator(testSchema, 'test');
                validator.validate(testObj);
                throw new Error('Validation should have failed');
            } catch (err) {
                if (errorMsg) {
                    expect((err as Error).message).toContain(errorMsg(Object.keys(testObj)[0]));
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
            const schema: Schema<any> = {
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
                it('should return valid configs', () => {
                    const testValues = [
                        { booleanDefaultTrue: false },
                        { booleanDefaultFalse: false },
                        // { booleanDefaultEmptyString: false },
                        // { booleanDefaultNull: false },
                        { booleanDefaultUndefined: false },
                        { booleanQuotedDefaultTrue: false },
                        { booleanQuotedDefaultFalse: false },
                        // { booleanQuotedDefaultEmptyString: false },
                        // { booleanQuotedDefaultNull: false },
                        { booleanQuotedDefaultUndefined: false },
                        { stringDefaultEmptyString: 'some string' },
                        { stringDefaultValidValue: 'some string' },
                        { stringDefaultInvalidValue: 'some string' },
                        { stringDefaultNull: 'some string' },
                        { stringDefaultUndefined: 'some string' },
                        { stringQuotedDefaultEmptyString: 'some string' },
                        { stringQuotedDefaultValidValue: 'some string' },
                        { stringQuotedDefaultInvalidValue: 'some string' },
                        { stringQuotedDefaultNull: 'some string' },
                        { stringQuotedDefaultUndefined: 'some string' },
                        { numberDefaultEmptyString: 10.5 },
                        { numberDefaultValidValue: 10.5 },
                        { numberDefaultInvalidValue: 10.5 },
                        { numberDefaultNull: 10.5 },
                        { numberDefaultUndefined: 10.5 },
                        { numberQuotedDefaultEmptyString: 10.5 },
                        { numberQuotedDefaultValidValue: 10.5 },
                        { numberQuotedDefaultInvalidValue: 10.5 },
                        { numberQuotedDefaultNull: 10.5 },
                        { numberQuotedDefaultUndefined: 10.5 },
                        { objectDefaultEmptyObject: { key: 'value' } },
                        { objectDefaultValidValue: { key: 'value' } },
                        { objectDefaultNull: { key: 'value' } },
                        { objectQuotedDefaultEmptyObject: { key: 'value' } },
                        { objectQuotedDefaultValidValue: { key: 'value' } },
                        { objectQuotedDefaultNull: { key: 'value' } },
                        { arrayDefaultEmptyArray: [5, 10, 23.4] },
                        { arrayDefaultValidValue: [5, 10, 23.4] },
                        { arrayDefaultInvalidValue: [5, 10, 23.4] },
                        { arrayDefaultNull: [5, 10, 23.4] },
                        { arrayDefaultUndefined: [5, 10, 23.4] },
                        { arrayQuotedDefaultEmptyArray: [5, 10, 23.4] },
                        { arrayQuotedDefaultValidValue: [5, 10, 23.4] },
                        { arrayQuotedDefaultInvalidValue: [5, 10, 23.4] },
                        { arrayQuotedDefaultNull: [5, 10, 23.4] },
                        { arrayQuotedDefaultUndefined: [5, 10, 23.4] },
                        { regExpDefaultEmptyString: /<(.*?)>/ },
                        { regExpDefaultValidValue: /<(.*?)>/ },
                        { regExpQuotedDefaultEmptyString: /<(.*?)>/ },
                        { regExpQuotedDefaultValidValue: /<(.*?)>/ },
                        // { objectDefaultInvalidValue: { key: 'value' } },
                        // { objectDefaultUndefined: { key: 'value' } },
                        // { objectQuotedDefaultInvalidValue: { key: 'value' } },
                        // { objectQuotedDefaultUndefined: { key: 'value' } },
                        // { regExpDefaultInvalidValue: /<(.*?)>/ },
                        // { regExpDefaultNull: /<(.*?)>/ },
                        // { regExpDefaultUndefined: /<(.*?)>/ },
                        // { regExpQuotedDefaultInvalidValue: /<(.*?)>/ },
                        // { regExpQuotedDefaultNull: /<(.*?)>/ },
                        // { regExpQuotedDefaultUndefined: /<(.*?)>/ },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema);
                });

                it('Object formats with non object defaults should fail validation', () => {
                    // The Object format gets mapped to convict's internal 'object', then the
                    // default is evaluated, and if it isn't an object the property is dropped
                    // from the schema.

                    const testValues = [
                        { objectDefaultInvalidValue: { key: 'value' } },
                        { objectDefaultUndefined: { key: 'value' } },
                        { objectQuotedDefaultInvalidValue: { key: 'value' } },
                        { objectQuotedDefaultUndefined: { key: 'value' } },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues, schema, () => 'Invalid input: expected record');
                });

                it('RegExp formats with non Regexp defaults should fail validation', () => {
                    const testValues = [
                        { regExpDefaultInvalidValue: /<(.*?)>/ },
                        { regExpDefaultNull: /<(.*?)>/ },
                        { regExpDefaultUndefined: /<(.*?)>/ },
                        { regExpQuotedDefaultInvalidValue: /<(.*?)>/ },
                        { regExpQuotedDefaultNull: /<(.*?)>/ },
                        { regExpQuotedDefaultUndefined: /<(.*?)>/ },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues, schema, (key) => `${key}: must be of type RegExp`);
                });
            });

            describe('null inputs', () => {
                describe('Booleans', () => {
                    const testValues = [
                        { booleanDefaultTrue: null },
                        { booleanDefaultFalse: null },
                        { booleanDefaultEmptyString: null },
                        { booleanDefaultNull: null },
                        { booleanDefaultUndefined: null },
                        { booleanQuotedDefaultTrue: null },
                        { booleanQuotedDefaultFalse: null },
                        { booleanQuotedDefaultEmptyString: null },
                        { booleanQuotedDefaultNull: null },
                        { booleanQuotedDefaultUndefined: null },
                    ];

                    it('should throw on validation', async () => {
                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected boolean');
                    });
                });

                describe('Strings', () => {
                    const testValues = [
                        { stringDefaultEmptyString: null },
                        { stringDefaultValidValue: null },
                        { stringDefaultInvalidValue: null },
                        { stringDefaultNull: null },
                        { stringDefaultUndefined: null },
                        { stringQuotedDefaultEmptyString: null },
                        { stringQuotedDefaultValidValue: null },
                        { stringQuotedDefaultInvalidValue: null },
                        { stringQuotedDefaultNull: null },
                        { stringQuotedDefaultUndefined: null },
                    ];

                    it('should throw on validation', async () => {
                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected string');
                    });
                });

                describe('Numbers', () => {
                    const testValues = [
                        { numberDefaultEmptyString: null },
                        { numberDefaultValidValue: null },
                        { numberDefaultInvalidValue: null },
                        { numberDefaultNull: null },
                        { numberDefaultUndefined: null },
                        { numberQuotedDefaultEmptyString: null },
                        { numberQuotedDefaultValidValue: null },
                        { numberQuotedDefaultInvalidValue: null },
                        { numberQuotedDefaultNull: null },
                        { numberQuotedDefaultUndefined: null },
                    ];

                    it('should throw on validation', async () => {
                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number');
                    });
                });

                describe('Objects', () => {
                    const testValues = [
                        { objectDefaultEmptyObject: null },
                        { objectDefaultValidValue: null },
                        { objectDefaultInvalidValue: null },
                        { objectDefaultNull: null },
                        { objectQuotedDefaultEmptyObject: null },
                        { objectQuotedDefaultValidValue: null },
                        { objectQuotedDefaultInvalidValue: null },
                        { objectQuotedDefaultNull: null },
                        { objectDefaultUndefined: null },
                        { objectQuotedDefaultUndefined: null },
                    ];

                    it('should throw on validation', async () => {
                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected record');
                    });
                });

                describe('Arrays', () => {
                    const testValues = [
                        { arrayDefaultEmptyArray: null },
                        { arrayDefaultValidValue: null },
                        { arrayDefaultInvalidValue: null },
                        { arrayDefaultNull: null },
                        { arrayDefaultUndefined: null },
                        { arrayQuotedDefaultEmptyArray: null },
                        { arrayQuotedDefaultValidValue: null },
                        { arrayQuotedDefaultInvalidValue: null },
                        { arrayQuotedDefaultNull: null },
                        { arrayQuotedDefaultUndefined: null },
                    ];

                    it('should throw on validation', async () => {
                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected array');
                    });
                });

                describe('RegExp', () => {
                    const testValues = [
                        { regExpDefaultEmptyString: null },
                        { regExpDefaultValidValue: null },
                        { regExpDefaultInvalidValue: null },
                        { regExpDefaultNull: null },
                        { regExpDefaultUndefined: null },
                        { regExpQuotedDefaultEmptyString: null },
                        { regExpQuotedDefaultValidValue: null },
                        { regExpQuotedDefaultInvalidValue: null },
                        { regExpQuotedDefaultNull: null },
                        { regExpQuotedDefaultUndefined: null },
                    ];

                    it('should throw on validation', async () => {
                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Input not instance of RegExp');
                    });
                });
            });

            describe('undefined inputs', () => {
                describe('Booleans', () => {
                    it('should use defaults', async () => {
                        const testValues = [
                            { booleanDefaultTrue: undefined },
                            { booleanDefaultFalse: undefined },
                            { booleanDefaultEmptyString: undefined },
                            { booleanDefaultNull: undefined },
                            { booleanDefaultUndefined: undefined },
                            { booleanQuotedDefaultTrue: undefined },
                            { booleanQuotedDefaultFalse: undefined },
                            { booleanQuotedDefaultEmptyString: undefined },
                            { booleanQuotedDefaultNull: undefined },
                            { booleanQuotedDefaultUndefined: undefined },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);
                            expect(validatedConfig).toMatchObject({ [key]: schemaObj.default });
                        }
                    });
                });

                describe('Strings', () => {
                    it('should use defaults', async () => {
                        const testValues = [
                            { stringDefaultEmptyString: undefined },
                            { stringDefaultValidValue: undefined },
                            { stringDefaultInvalidValue: undefined },
                            { stringDefaultNull: undefined },
                            { stringDefaultUndefined: undefined },
                            { stringQuotedDefaultEmptyString: undefined },
                            { stringQuotedDefaultValidValue: undefined },
                            { stringQuotedDefaultInvalidValue: undefined },
                            { stringQuotedDefaultNull: undefined },
                            { stringQuotedDefaultUndefined: undefined },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);
                            expect(validatedConfig).toMatchObject({ [key]: schemaObj.default });
                        }
                    });
                });

                describe('Numbers', () => {
                    it('should use defaults', async () => {
                        const testValues = [
                            { numberDefaultUndefined: undefined },
                            { numberQuotedDefaultUndefined: undefined },
                            { numberDefaultEmptyString: undefined },
                            { numberDefaultValidValue: undefined },
                            { numberDefaultInvalidValue: undefined },
                            { numberDefaultNull: undefined },
                            { numberQuotedDefaultEmptyString: undefined },
                            { numberQuotedDefaultValidValue: undefined },
                            { numberQuotedDefaultInvalidValue: undefined },
                            { numberQuotedDefaultNull: undefined },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);
                            expect(validatedConfig).toMatchObject({ [key]: schemaObj.default });
                        }
                    });
                });

                describe('Objects', () => {
                    it('should use defaults', async () => {
                        const testValues = [
                            { objectDefaultUndefined: undefined },
                            { objectQuotedDefaultUndefined: undefined },
                            { objectDefaultEmptyObject: undefined },
                            { objectDefaultValidValue: undefined },
                            { objectDefaultInvalidValue: undefined },
                            { objectDefaultNull: undefined },
                            { objectQuotedDefaultEmptyObject: undefined },
                            { objectQuotedDefaultValidValue: undefined },
                            { objectQuotedDefaultInvalidValue: undefined },
                            { objectQuotedDefaultNull: undefined },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);
                            expect(validatedConfig).toMatchObject({ [key]: schemaObj.default });
                        }
                    });
                });

                describe('Arrays', () => {
                    it('should use defaults', async () => {
                        const testValues = [
                            { arrayDefaultUndefined: undefined },
                            { arrayQuotedDefaultUndefined: undefined },
                            { arrayDefaultEmptyArray: undefined },
                            { arrayDefaultValidValue: undefined },
                            { arrayDefaultInvalidValue: undefined },
                            { arrayDefaultNull: undefined },
                            { arrayQuotedDefaultEmptyArray: undefined },
                            { arrayQuotedDefaultValidValue: undefined },
                            { arrayQuotedDefaultInvalidValue: undefined },
                            { arrayQuotedDefaultNull: undefined },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);
                            expect(validatedConfig).toMatchObject({ [key]: schemaObj.default });
                        }
                    });
                });

                describe('RegExp', () => {
                    it('should use defaults', async () => {
                        const testValues = [
                            { regExpDefaultUndefined: undefined },
                            { regExpQuotedDefaultUndefined: undefined },
                            { regExpDefaultEmptyString: undefined },
                            { regExpDefaultValidValue: undefined },
                            { regExpDefaultInvalidValue: undefined },
                            { regExpDefaultNull: undefined },
                            { regExpQuotedDefaultEmptyString: undefined },
                            { regExpQuotedDefaultValidValue: undefined },
                            { regExpQuotedDefaultInvalidValue: undefined },
                            { regExpQuotedDefaultNull: undefined },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);
                            expect(validatedConfig).toMatchObject({ [key]: schemaObj.default });
                        }
                    });
                });
            });

            describe('empty string inputs', () => {
                describe('Booleans', () => {
                    it('empty string coerced to true', () => {
                        const testValues = [
                            { booleanDefaultUndefined: '' },
                            { booleanDefaultTrue: '' },
                            { booleanDefaultFalse: '' },
                            { booleanDefaultEmptyString: '' },
                            { booleanDefaultNull: '' },
                            { booleanQuotedDefaultTrue: '' },
                            { booleanQuotedDefaultUndefined: '' },
                            { booleanQuotedDefaultFalse: '' },
                            { booleanQuotedDefaultEmptyString: '' },
                            { booleanQuotedDefaultNull: '' },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);

                            const finalObj: AnyObject = {};
                            finalObj[key] = true;
                            expect(validatedConfig).toMatchObject(finalObj);
                        }
                    });
                });

                describe('Strings', () => {
                    it('should accept empty string no matter the default', () => {
                        const testValues = [
                            { stringDefaultEmptyString: '' },
                            { stringDefaultValidValue: '' },
                            { stringDefaultInvalidValue: '' },
                            { stringDefaultUndefined: '' },
                            { stringDefaultNull: '' },
                            { stringQuotedDefaultEmptyString: '' },
                            { stringQuotedDefaultValidValue: '' },
                            { stringQuotedDefaultInvalidValue: '' },
                            { stringQuotedDefaultUndefined: '' },
                            { stringQuotedDefaultNull: '' },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });
                });

                describe('Numbers', () => {
                    it('undefined coerced to NaN', () => {
                        const testValues = [
                            { numberDefaultEmptyString: '' },
                            { numberDefaultValidValue: '' },
                            { numberDefaultInvalidValue: '' },
                            { numberDefaultUndefined: '' },
                            { numberDefaultNull: '' },
                            { numberQuotedDefaultEmptyString: '' },
                            { numberQuotedDefaultValidValue: '' },
                            { numberQuotedDefaultInvalidValue: '' },
                            { numberQuotedDefaultUndefined: '' },
                            { numberQuotedDefaultNull: '' },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);

                            const finalObj: AnyObject = {};
                            finalObj[key] = NaN;
                            expect(validatedConfig).toMatchObject(finalObj);
                        }
                    });
                });

                describe('Objects', () => {
                    it('should throw on validation', () => {
                        const testValues = [
                            { objectDefaultInvalidValue: '' },
                            { objectDefaultUndefined: '' },
                            { objectQuotedDefaultInvalidValue: '' },
                            { objectQuotedDefaultUndefined: '' },
                            { objectDefaultEmptyObject: '' },
                            { objectDefaultValidValue: '' },
                            { objectDefaultNull: '' },
                            { objectQuotedDefaultEmptyObject: '' },
                            { objectQuotedDefaultValidValue: '' },
                            { objectQuotedDefaultNull: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected record, received string');
                    });
                });

                describe('Arrays', () => {
                    it('should coerce empty string to array', () => {
                        const testValues = [
                            { arrayDefaultEmptyArray: '' },
                            { arrayDefaultValidValue: '' },
                            { arrayDefaultInvalidValue: '' },
                            { arrayDefaultUndefined: '' },
                            { arrayDefaultNull: '' },
                            { arrayQuotedDefaultEmptyArray: '' },
                            { arrayQuotedDefaultValidValue: '' },
                            { arrayQuotedDefaultInvalidValue: '' },
                            { arrayQuotedDefaultUndefined: '' },
                            { arrayQuotedDefaultNull: '' },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);

                            const finalObj: AnyObject = {};
                            finalObj[key] = [''];
                            expect(validatedConfig).toMatchObject(finalObj);
                        }
                    });
                });

                describe('RegExp', () => {
                    it('should coerce empty string to undefined', () => {
                        const testValues = [
                            { RegexpDefaultEmptyString: '' },
                            { RegexpDefaultValidValue: '' },
                            { RegexpDefaultInvalidValue: '' },
                            { RegexpDefaultNull: '' },
                            { RegexpDefaultUndefined: '' },
                            { RegexpQuotedDefaultEmptyString: '' },
                            { RegexpQuotedDefaultValidValue: '' },
                            { RegexpQuotedDefaultInvalidValue: '' },
                            { RegexpQuotedDefaultNull: '' },
                            { RegexpQuotedDefaultUndefined: '' },
                        ];

                        for (const testObj of testValues) {
                            const key = Object.keys(testObj)[0];
                            const schemaObj = schema[key];

                            const testSchema: AnyObject = {};
                            testSchema[key] = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate(testObj);

                            const finalObj: AnyObject = {};
                            finalObj[key] = undefined;
                            expect(validatedConfig).toMatchObject(finalObj);
                        }
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
                it('should return valid configs', () => {
                    const testValues = [
                        { asteriskDefaultTrue: 'hello' },
                        { asteriskDefaultFalse: 'hello' },
                        { asteriskDefaultEmptyString: 'hello' },
                        { asteriskDefaultNull: 'hello' },
                        { asteriskDefaultUndefined: 'hello' },
                        { intDefaultValidValue: -7 },
                        { intDefaultInvalidValue: -7 },
                        { intDefaultEmptyString: -7 },
                        { intDefaultNull: -7 },
                        { intDefaultUndefined: -7 },
                        { portDefaultValidValue: 9000 },
                        { portDefaultInvalidValue: 9000 },
                        { portDefaultEmptyString: 9000 },
                        { portDefaultNull: 9000 },
                        { portDefaultUndefined: 9000 },
                        { natDefaultValidValue: 5 },
                        { natDefaultInvalidValue: 5 },
                        { natDefaultEmptyString: 5 },
                        { natDefaultNull: 5 },
                        { natDefaultUndefined: 5 },
                        { urlDefaultValidValue: 'http://example.com' },
                        { urlDefaultInvalidValue: 'http://example.com' },
                        { urlDefaultEmptyString: 'http://example.com' },
                        { urlDefaultNull: 'http://example.com' },
                        { urlDefaultUndefined: 'http://example.com' },
                        { emailDefaultValidValue: 'goodbye@example.com' },
                        { emailDefaultInvalidValue: 'goodbye@example.com' },
                        { emailDefaultEmptyString: 'goodbye@example.com' },
                        { emailDefaultNull: 'goodbye@example.com' },
                        { emailDefaultUndefined: 'goodbye@example.com' },
                        { ipAddressDefaultValidValue: '72.156.20.4' },
                        { ipAddressDefaultInvalidValue: '72.156.20.4' },
                        { ipAddressDefaultEmptyString: '72.156.20.4' },
                        { ipAddressDefaultNull: '72.156.20.4' },
                        { ipAddressDefaultUndefined: '72.156.20.4' },
                    ];

                    expect.hasAssertions();
                    successfulValidation(testValues, schema);
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
                    it('will throw on validation', () => {
                        const testValues = [
                            { intDefaultValidValue: null },
                            { intDefaultInvalidValue: null },
                            { intDefaultEmptyString: null },
                            { intDefaultNull: null },
                            { intDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received null');
                    });
                });

                describe('port', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { portDefaultValidValue: null },
                            { portDefaultInvalidValue: null },
                            { portDefaultEmptyString: null },
                            { portDefaultNull: null },
                            { portDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received null');
                    });
                });

                describe('nat', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { natDefaultValidValue: null },
                            { natDefaultInvalidValue: null },
                            { natDefaultEmptyString: null },
                            { natDefaultNull: null },
                            { natDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received null');
                    });
                });

                describe('url', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { urlDefaultValidValue: null },
                            { urlDefaultInvalidValue: null },
                            { urlDefaultEmptyString: null },
                            { urlDefaultNull: null },
                            { urlDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected string, received null');
                    });
                });

                describe('email', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { emailDefaultValidValue: null },
                            { emailDefaultInvalidValue: null },
                            { emailDefaultEmptyString: null },
                            { emailDefaultNull: null },
                            { emailDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected string, received null');
                    });
                });

                describe('ipaddress', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { ipAddressDefaultValidValue: null },
                            { ipAddressDefaultInvalidValue: null },
                            { ipAddressDefaultEmptyString: null },
                            { ipAddressDefaultNull: null },
                            { ipAddressDefaultUndefined: null },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected string, received null');
                    });
                });
            });

            describe('undefined inputs', () => {
                describe('asterisk', () => {
                    it('will accept undefined', () => {
                        const testValues = [
                            { asteriskDefaultTrue: undefined },
                            { asteriskDefaultFalse: undefined },
                            { asteriskDefaultEmptyString: undefined },
                            { asteriskDefaultNull: undefined },
                            { asteriskDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });
                });

                describe('int', () => {
                    it('will accept undefined if default undefined', () => {
                        const testValues = [
                            { intDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { intDefaultValidValue: undefined },
                            { intDefaultInvalidValue: undefined },
                            { intDefaultEmptyString: undefined },
                            { intDefaultNull: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `${key}: must be an integer`);
                    });
                });

                describe('port', () => {
                    it('will accept undefined if default undefined', () => {
                        const testValues = [
                            { portDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { portDefaultValidValue: undefined },
                            { portDefaultInvalidValue: undefined },
                            { portDefaultEmptyString: undefined },
                            { portDefaultNull: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `${key}: ports must be within range 0 - 65535`);
                    });
                });

                describe('nat', () => {
                    it('will accept undefined if default undefined', () => {
                        const testValues = [
                            { natDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { natDefaultValidValue: undefined },
                            { natDefaultInvalidValue: undefined },
                            { natDefaultEmptyString: undefined },
                            { natDefaultNull: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `${key}: must be a positive integer`);
                    });
                });

                describe('url', () => {
                    it('will accept undefined if default undefined', () => {
                        const testValues = [
                            { urlDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { urlDefaultValidValue: undefined },
                            { urlDefaultInvalidValue: undefined },
                            { urlDefaultEmptyString: undefined },
                            { urlDefaultNull: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `${key}: Expected a string but received a undefined`);
                    });
                });

                describe('email', () => {
                    it('will accept undefined if default undefined', () => {
                        const testValues = [
                            { emailDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { emailDefaultValidValue: undefined },
                            { emailDefaultInvalidValue: undefined },
                            { emailDefaultEmptyString: undefined },
                            { emailDefaultNull: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `${key}: Expected a string but received a undefined`);
                    });
                });

                describe('ipaddress', () => {
                    it('will accept undefined if default undefined', () => {
                        const testValues = [
                            { ipAddressDefaultUndefined: undefined },
                        ];

                        expect.hasAssertions();
                        successfulValidation(testValues, schema);
                    });

                    it('will throw on validation for other defaults', () => {
                        const testValues = [
                            { ipAddressDefaultValidValue: undefined },
                            { ipAddressDefaultInvalidValue: undefined },
                            { ipAddressDefaultEmptyString: undefined },
                            { ipAddressDefaultNull: undefined },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, (key) => `${key}: Expected a string but received a undefined`);
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
                    it('will throw on validation', () => {
                        const testValues = [
                            { intDefaultValidValue: '' },
                            { intDefaultInvalidValue: '' },
                            { intDefaultEmptyString: '' },
                            { intDefaultNull: '' },
                            { intDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received string');
                    });
                });

                describe('port', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { portDefaultValidValue: '' },
                            { portDefaultInvalidValue: '' },
                            { portDefaultEmptyString: '' },
                            { portDefaultNull: '' },
                            { portDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received string');
                    });
                });

                describe('nat', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { natDefaultValidValue: '' },
                            { natDefaultInvalidValue: '' },
                            { natDefaultEmptyString: '' },
                            { natDefaultNull: '' },
                            { natDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid input: expected number, received string');
                    });
                });

                describe('url', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { urlDefaultValidValue: '' },
                            { urlDefaultInvalidValue: '' },
                            { urlDefaultEmptyString: '' },
                            { urlDefaultNull: '' },
                            { urlDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid URL');
                    });
                });

                describe('email', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { emailDefaultValidValue: '' },
                            { emailDefaultInvalidValue: '' },
                            { emailDefaultEmptyString: '' },
                            { emailDefaultNull: '' },
                            { emailDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(testValues, schema, () => 'Invalid email address');
                    });
                });

                describe('ipaddress', () => {
                    it('will throw on validation', () => {
                        const testValues = [
                            { ipAddressDefaultValidValue: '' },
                            { ipAddressDefaultInvalidValue: '' },
                            { ipAddressDefaultEmptyString: '' },
                            { ipAddressDefaultNull: '' },
                            { ipAddressDefaultUndefined: '' },
                        ];

                        expect.hasAssertions();
                        failedValidation(
                            testValues,
                            schema,
                            undefined,
                            /(?=.*Invalid IPv4 address)(?=.*Invalid IPv6 address)/s
                        );
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

            describe('valid inputs', () => {
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
                it('will throw when validation parses defaults that are invalid', () => {
                    const testValues1 = [
                        { inlineFunctionDefaultInvalidBoolean: 'hello' },
                        { inlineFunctionDefaultInvalidNumber: 'hello' },
                    ];

                    const testValues2 = [
                        { inlineFunctionDefaultInvalidObject: 'hello' },
                        { inlineFunctionDefaultInvalidArray: 'hello' },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues1, schema, (key) => `${key}: if parameter is defined it must be a string`);
                    failedValidation(testValues2, schema, () => 'Unexpected token \'h\', "hello" is not valid JSON');
                });
            });

            describe('null inputs', () => {
                it('will use null as format function parameter if null explicitly set, not use the default', () => {
                    const testValues = [
                        { inlineFunctionDefaultValidValue: null },
                        { inlineFunctionDefaultEmptyString: null },
                        { inlineFunctionDefaultNull: null },
                        { inlineFunctionDefaultUndefined: null },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues, schema, (key) => `${key}: if parameter is defined it must be a string`);
                });
            });

            describe('undefined inputs', () => {
                it('will use undefined as format function parameter if undefined explicitly set, not use the default', () => {
                    const testValues1 = [
                        { inlineFunctionDefaultValidValue: undefined },
                        { inlineFunctionDefaultEmptyString: undefined },
                        { inlineFunctionDefaultNull: undefined },
                    ];

                    const testValues2 = [
                        // undefined value is accepted if default is also undefined
                        { inlineFunctionDefaultUndefined: undefined },
                    ];

                    expect.hasAssertions();
                    failedValidation(testValues1, schema, (key) => `${key}: if parameter is defined it must be a string`);
                    successfulValidation(testValues2, schema);
                });
            });

            describe('empty string inputs', () => {
                it('will accept empty string', () => {
                    const testValues = [
                        { inlineFunctionDefaultValidValue: '' },
                        { inlineFunctionDefaultEmptyString: '' },
                        { inlineFunctionDefaultNull: '' },
                        { inlineFunctionDefaultUndefined: '' },
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

                            const validator = new SchemaValidator(testSchema, 'test');
                            const validatedConfig = validator.validate({});
                            expect(validatedConfig).toMatchObject({ [key]: schemaObj.default });
                        }
                    });

                    it('null default will fail', () => {
                        try {
                            const schemaObj = schema.inlineFunctionDefaultNull;

                            const testSchema: AnyObject = {};
                            testSchema.inlineFunctionDefaultNull = schemaObj;

                            const validator = new SchemaValidator(testSchema, 'test');
                            validator.validate({});
                            throw new Error('Validation should have failed');
                        } catch (err) {
                            expect((err as Error).message).toContain('inlineFunctionDefaultNull: if parameter is defined it must be a string');
                        }
                    });

                    it('undefined default will strip key from object', () => {
                        const schemaObj = schema.inlineFunctionDefaultUndefined;

                        const testSchema: AnyObject = {};
                        testSchema.inlineFunctionDefaultUndefined = schemaObj;

                        const validator = new SchemaValidator(testSchema, 'test');
                        const validatedConfig = validator.validate({});
                        expect(validatedConfig).toMatchObject({});
                    });
                });
            });
        });
    });

    describe('args and env vars', () => {
        const schema: Schema<any> = {
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

                const validator = new SchemaValidator(schema, 'test');
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

                const validator = new SchemaValidator(schema, 'test');
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

                const validator = new SchemaValidator(schema, 'test');
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

                const validator = new SchemaValidator(schema, 'test');
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

                const validator = new SchemaValidator(schema, 'test');
                const validatedConfig = validator.validate(testValues);
                expect(validatedConfig).toMatchObject(convertedValues);
            });
        });
    });
});
