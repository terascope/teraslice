import { OperationAPI } from '../../../src';

// @ts-ignore
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
}
