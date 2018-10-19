'use strict';

const { FilterProcessor } = require('@terascope/job-components');

class ExampleFilter extends FilterProcessor {
    filter(data) {
        return data.statusCode < 400;
    }
}

module.exports = ExampleFilter;
