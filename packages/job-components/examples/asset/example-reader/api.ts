import { OperationAPI } from '@terascope/job-components';

export default class ExampleAPI extends OperationAPI {
    name() {
        return 'ExampleAPI';
    }

    async createAPI(config) {
        return {
            config,
            say() {
                return 'hello';
            }
        };
    }
}
