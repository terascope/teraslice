'use strict';

const { OperationAPI } = require('@terascope/job-components');

class ExampleAPI extends OperationAPI {
    createAPI(config) {
        return {
            config,
            say() {
                return 'hello';
            }
        };
    }
}

module.exports = ExampleAPI;
