'use strict';

const { ConvictSchema } = require('../../..');

class Schema extends ConvictSchema {
    validateJob(job) {
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

module.exports = Schema;
