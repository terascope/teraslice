'use strict';

const { FilterProcessor } = require('@terascope/job-components');

class <%= name %> extends FilterProcessor {
    filter(doc) {
        // example code, processor code goes here
        if (doc.type === this.opConfig.type) {
            return true;
        }
        return false;
    }
}

module.exports = <%= name %>;
