'use strict';

const uuidv4 = require('uuid/v4');
const { Slicer } = require('@terascope/job-components');

class ExampleSlicer extends Slicer {
    async initialize(recoveryData) {
        this.initialized = true;
        return super.initialize(recoveryData);
    }

    async shutdown() {
        this.shutdown = true;
        return super.shutdown();
    }

    async slice() {
        return {
            id: uuidv4(),
            fetchFrom: 'https://httpstat.us/200'
        };
    }
}

module.exports = ExampleSlicer;
