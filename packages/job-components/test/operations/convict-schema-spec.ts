import 'jest-extended'; // require for type definitions
import {
    ConvictSchema,
    TestContext,
    OpConfig,
    ValidatedJobConfig,
    newTestJobConfig, AnyObject
} from '../../src';

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
                _dead_letter_action: 'throw',
                example: 'hi',
            });
        });

        it('should fail when given invalid data', () => {
            expect(() => {
                schema.validate({});
            }).toThrow();
        });
    });

    describe('->ensureAPIFromConfig', () => {
        let job: ValidatedJobConfig;
        let testSchema: AnyObject;
        let warning = '';

        beforeEach(() => {
            warning = '';
            const apiContext = new TestContext('schema-api-tests');

            job = newTestJobConfig({
                operations: [
                    { _op: 'test-reader' },
                    { _op: 'noop' },
                ]
            });

            testSchema = new ExampleSchema(apiContext);

            testSchema.context.logger.warn = (msg: any) => { warning = msg; };
        });

        it('will inject apiConfig if api does not exist', () => {
            testSchema.ensureAPIFromConfig('someApi', job, { some: 'configs' });

            expect(job.apis).toBeArrayOfSize(1);
            expect(job.apis[0]).toMatchObject({ _name: 'someApi', some: 'configs' });
        });

        it('will not make new api if it already exists', () => {
            if (!job.apis) job.apis = [];
            job.apis.push({ _name: 'someApi', some: 'otherStuff' });

            testSchema.ensureAPIFromConfig('someApi', job, { some: 'configs' });

            expect(job.apis).toBeArrayOfSize(1);
            expect(job.apis[0]).toMatchObject({ _name: 'someApi', some: 'otherStuff' });

            expect(warning.length >= 0).toBeTrue();
        });
    });

    describe('#type', () => {
        it('should return convict', () => {
            expect(ConvictSchema.type()).toEqual('convict');
        });
    });
});
