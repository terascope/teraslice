import { OperationAPI } from '../../../src';

export default class ExampleAPI extends OperationAPI {
    _initialized = false;
    _shutdown = false;

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }

    async createAPI() {
        return {};
    }

    name() {
        return 'ExampleAPI';
    }

    async handle(config: any) {
        return {
            config,
            say() {
                return 'hello';
            }
        };
    }
}
