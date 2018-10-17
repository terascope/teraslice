'use strict';

const { FilterProcessor } = require('@terascope/job-components');

class ExampleFilter extends FilterProcessor {
    filter(data) {
        if (data.statusCode > 400) {
            return null;
        }
        return data;
    }
}

module.exports = ExampleFilter;
