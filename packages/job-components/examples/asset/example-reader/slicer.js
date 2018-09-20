'use strict';

const uuidv4 = require('uuid/v4');
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
