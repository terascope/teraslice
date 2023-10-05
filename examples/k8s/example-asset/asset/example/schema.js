'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            type: {
                doc: 'An example of a property schema',
                default: 'string',
                format: 'String',
            }
        };
    }
}

module.exports = Schema;
