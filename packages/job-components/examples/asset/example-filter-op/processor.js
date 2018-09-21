'use strict';

const { Processor } = require('@terascope/job-components');

class ExampleFilter extends Processor {
    onData(data) {
        if (data.statusCode > 400) {
            return null;
        }
        return data;
    }
}

module.exports = ExampleFilter;
