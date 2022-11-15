import { OperationAPI } from '@terascope/job-components';

export default class ExampleAPI extends OperationAPI {
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
