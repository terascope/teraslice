import { OperationAPI } from '../../../src';

export default class ExampleAPI extends OperationAPI {
    _initialized = false;
    _shutdown = false;

    async initialize() {
        this._initialized = true;
        return super.initialize();
    }

    async createAPI() {
        return {};
    }

    async shutdown() {
        this._shutdown = true;
        return super.shutdown();
    }
}
