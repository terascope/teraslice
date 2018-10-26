'use strict';

const { ConvictSchema } = require('@terascope/job-components');

class Schema extends ConvictSchema {
    build() {
        return {
            ms: {
                default: 100,
                doc: 'Time delay in milliseconds',
                format: 'Number'
            }
        };
    }
}

module.exports = Schema;
