'use strict';

const { OperationAPI } = require('../../..');

class ExampleAPI extends OperationAPI {
    async initialize() {
        this.initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this.shutdown = true;
        return super.shutdown();
    }

    name() {
        return 'ExampleAPI';
    }

    async handle(config) {
        return {
            config,
            say() {
                return 'hello';
            }
        };
    }
}

module.exports = ExampleAPI;
