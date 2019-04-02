'use strict';

const { FilterProcessor } = require('@terascope/job-components');

class <%= name %> extends FilterProcessor {
    constructor(...args) {
        super(...args);
        // the args are context, opConfig, executionConfig
        this.opConfig.type = 'string';
    }

    filter(doc) {
        if (doc.type === this.opConfig.type) {
            return true;
        }
        return false;
    }
}

module.exports = <%= name %>;
