import 'jest-extended'; // require for type definitions
import { ConvictSchema, TestContext, OpConfig } from '../../src';

describe('Convict Schema', () => {
    const context = new TestContext('job-components');
    interface ExampleOpConfig extends OpConfig {
        example: string;
    }

    class ExampleSchema extends ConvictSchema<ExampleOpConfig> {
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
            expect(schema.validate({
                _op: 'hello',
                example: 'hi'
            })).toEqual({
                _op: 'hello',
                _encoding: 'json',
                _dead_letter_action: 'none',
                example: 'hi',
            });
        });

        it('should fail when given invalid data', () => {
            expect(() => {
                schema.validate({});
            }).toThrow();
        });
    });

    describe('#type', () => {
        it('should return convict', () => {
            expect(ConvictSchema.type()).toEqual('convict');
        });
    });
});
