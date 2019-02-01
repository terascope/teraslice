import { ConvictSchema, ValidatedJobConfig } from '../../../src';

export default class Schema extends ConvictSchema<any, any> {
    validateJob(job: ValidatedJobConfig) {
        const shouldFail = job.operations.find(op => op.failCrossValidation);
        if (shouldFail) {
            throw new Error('Failing job validation');
        }
    }

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
