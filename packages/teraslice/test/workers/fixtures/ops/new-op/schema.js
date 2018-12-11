'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            example: {
                default: 'examples are quick and easy',
                doc: 'A random example schema property',
                format: 'String',
            },
            failOnSliceRetry: {
                default: false,
                doc: 'fail on slice retry',
                format: Boolean,
            }
        };
    }
}

module.exports = Schema;
