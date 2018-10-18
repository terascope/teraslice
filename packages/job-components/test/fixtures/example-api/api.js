'use strict';

const { OperationAPI } = require('../../../dist');

class ExampleAPI extends OperationAPI {
    async initialize() {
        this.initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this.shutdown = true;
        return super.shutdown();
    }
}

module.exports = ExampleAPI;
