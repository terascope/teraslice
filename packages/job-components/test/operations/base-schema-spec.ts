import 'jest-extended';
import {
    BaseSchema, TestContext, OpConfig, getValidationWarnings
} from '../../src/index.js';

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
            const config = schema.validate({
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
            const warnings = getValidationWarnings(schema.validate({ _op: 'hello', example: 'hi' }));
            expect(warnings).toBeArrayOfSize(0);
        });

        it('should return a warning when a deprecated field is provided', () => {
            const depSchema = new DeprecatedSchema(context);
            const warnings = getValidationWarnings(
                depSchema.validate({ _op: 'hello', old_field: 'some_value' })
            );
            expect(warnings).toBeArrayOfSize(1);
            expect(warnings[0]).toMatchObject({
                type: 'JobValidation',
                reason: {
                    type: 'assetOperation',
                    kind: 'deprecation',
                    reason: {
                        _op: 'hello',
                        field: 'old_field',
                        description: 'use new_field instead',
                    },
                },
            });
        });

        it('should not warn about deprecated fields set to their default value', () => {
            const depSchema = new DeprecatedSchema(context);
            const warnings = getValidationWarnings(depSchema.validate({ _op: 'hello' }));
            expect(warnings).toBeArrayOfSize(0);
        });

        // Forward-compatibility guard for https://github.com/terascope/teraslice/issues/4509
        // validate() must return the flat config (not a { config, warnings } wrapper) so an
        // asset built with this job-components still works on a Teraslice runtime that has no
        // unwrap logic. Warnings ride along on a non-enumerable property that never survives
        // serialization onto the stored execution.
        it('should return a flat config and not serialize the attached warnings', () => {
            const depSchema = new DeprecatedSchema(context);
            const config = depSchema.validate({ _op: 'hello', old_field: 'some_value' });

            // flat: the op's params are top-level, not nested under `.config`
            expect(config).toHaveProperty('_op', 'hello');
            expect(config).toHaveProperty('old_field', 'some_value');
            expect(config).not.toHaveProperty('config');
            expect(config).not.toHaveProperty('warnings');

            // warnings are attached but invisible to enumeration/serialization
            expect(getValidationWarnings(config)).toBeArrayOfSize(1);
            expect(Object.keys(config)).not.toContain('__validationWarnings');
            expect(JSON.parse(JSON.stringify(config))).not.toHaveProperty('__validationWarnings');
        });
    });

    describe('#type', () => {
        it('should return convict', () => {
            expect(BaseSchema.type()).toEqual('convict');
        });
    });
});
