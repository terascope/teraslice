'use strict';

const { MapProcessor } = require('@terascope/job-components');

class <%= name %> extends MapProcessor {
    map(doc) {
        // example code, processor code goes here
        if (doc.type) {
            return doc;
        }
        doc.type = this.opConfig.type;
        return doc;
    }
}

module.exports = <%= name %>;
