import { OperationAPI } from '../../../../src/index.js';

// @ts-expect-error
export default class ExampleAPI extends OperationAPI {
    _initialized = false;
    _shutdown = false;

    async initialize(): Promise<void> {
        this._initialized = true;
        return super.initialize();
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }
}
