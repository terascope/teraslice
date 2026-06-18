import 'jest-extended';
import { BaseSchema, TestContext, OpConfig } from '../../src/index.js';

describe('Base Schema', () => {
    const context = new TestContext('job-components');

    interface ExampleOpConfig extends OpConfig {
        example: string;
    }

    class ExampleSchema extends BaseSchema<ExampleOpConfig> {
        build() {
            return {
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                }
            };
        }
    }

    interface DeprecatedOpConfig extends OpConfig {
        old_field: string;
    }

    class DeprecatedSchema extends BaseSchema<DeprecatedOpConfig> {
        build() {
            return {
                old_field: {
                    default: 'default_value',
                    doc: 'A deprecated field',
                    format: 'String',
                    deprecated: 'use new_field instead',
                }
            };
        }
    }

    const schema = new ExampleSchema(context);

    describe('->build', () => {
        it('should return the schema', () => {
            expect(schema.build()).toEqual({
                example: {
                    default: 'examples are quick and easy',
                    doc: 'A random example schema property',
                    format: 'String',
                }
            });
        });
    });

    describe('->validate', () => {
        it('should succeed when given valid data', () => {
            const { config } = schema.validate({
                _op: 'hello',
                example: 'hi'
            });
            expect(config).toEqual({
                _op: 'hello',
                _encoding: 'json',
                _dead_letter_action: 'throw',
                example: 'hi',
            });
        });

        it('should fail when given invalid data', () => {
            expect(() => {
                schema.validate({});
            }).toThrow();
        });

        it('should return no warnings when no deprecated fields are used', () => {
            const { warnings } = schema.validate({ _op: 'hello', example: 'hi' });
            expect(warnings).toBeArrayOfSize(0);
        });

        it('should return a warning when a deprecated field is provided', () => {
            const depSchema = new DeprecatedSchema(context);
            const { warnings } = depSchema.validate({ _op: 'hello', old_field: 'some_value' });
            expect(warnings).toBeArrayOfSize(1);
            expect(warnings[0]).toMatchObject({
                category: 'deprecation',
                subcategory: 'assetOperationProperty',
                name: 'hello',
                field: 'old_field',
                description: 'use new_field instead',
            });
        });

        it('should not warn about deprecated fields set to their default value', () => {
            const depSchema = new DeprecatedSchema(context);
            const { warnings } = depSchema.validate({ _op: 'hello' });
            expect(warnings).toBeArrayOfSize(0);
        });
    });

    describe('#type', () => {
        it('should return convict', () => {
            expect(BaseSchema.type()).toEqual('convict');
        });
    });
});
