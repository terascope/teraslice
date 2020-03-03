'use strict';

const { v4: uuidv4 } = require('uuid');
const { Slicer } = require('@terascope/job-components');

class ExampleSlicer extends Slicer {
    async slice() {
        return {
            id: uuidv4(),
            fetchFrom: 'https://httpstat.us/200'
        };
    }
}

module.exports = ExampleSlicer;
