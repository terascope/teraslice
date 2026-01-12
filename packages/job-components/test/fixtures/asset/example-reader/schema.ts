import { BaseSchema, ValidatedJobConfig } from '../../../../src/index.js';

export default class Schema extends BaseSchema<any, any> {
    validateJob(job: ValidatedJobConfig): void {
        const shouldFail = job.operations.find((op) => op.failCrossValidation);
        if (shouldFail) {
            throw new Error('Failing job validation');
        }
    }

    build(): Record<string, any> {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            },
        };
    }
}
