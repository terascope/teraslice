'use strict';

const { <%= type %>Processor } = require('@terascope/job-components');

class <%= name %> extends <%= type %>Processor {
    constructor(...args) {
        super(...args);
        // the args are context, opConfig, executionConfig
        // reference the args this.context, this.opConfig, or this.executionConfig
    }

    <%= typeFunc %>(<%= dataType %>) {
        /*  NOTE:  The filter and map processor functions handle one item in the array at a time
            the onBatch processor expects the entire data array.
            To reference a property specified in the schema use this.opConfig.property_name
        */

        // sample code
        <%- sampleCode %>
    }
}

module.exports = <%= name %>;
