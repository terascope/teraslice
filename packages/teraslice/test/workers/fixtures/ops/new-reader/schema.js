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
            countPerSlicer: {
                default: 10,
                doc: 'The number of slices for the slicer to create',
                format: 'Number',
            },
            countPerFetch: {
                default: 10,
                doc: 'The number of records to return from the fetcher',
                format: 'Number',
            }
        };
    }
}

module.exports = Schema;
