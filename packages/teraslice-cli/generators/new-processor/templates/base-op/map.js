'use strict';

const { MapProcessor } = require('@terascope/job-components');

class <%= name %> extends MapProcessor {
    constructor(...args) {
        super(...args);
        // the args are context, opConfig, executionConfig
        this.opConfig.type = 'string';
    }

    map(doc) {
        if (doc.type) {
            return doc;
        }
        doc.type = this.opConfig.type;
        return doc;
    }
}

module.exports = <%= name %>;
