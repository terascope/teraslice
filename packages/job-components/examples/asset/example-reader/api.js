'use strict';

const { OperationAPI } = require('@terascope/job-components');

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
