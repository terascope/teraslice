'use strict';

const { OperationAPI } = require('../../..');

class ExampleAPI extends OperationAPI {
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
