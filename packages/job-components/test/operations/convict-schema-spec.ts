import 'jest-extended'; // require for type definitions
import { ConvictSchema } from '../../src';

describe('Convict Schema', () => {
    describe('->build', () => {
        class ExampleSchema extends ConvictSchema {
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

        const schema = new ExampleSchema();

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

    describe('#type', () => {
        it('should return convict', () => {
            expect(ConvictSchema.type()).toEqual('convict');
        });
    });
});
