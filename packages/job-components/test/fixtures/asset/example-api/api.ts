import { AnyObject } from '@terascope/core-utils';
import { OperationAPI } from '../../../../src/index.js';

export default class ExampleAPI extends OperationAPI {
    _initialized = false;
    _shutdown = false;

    async initialize(): Promise<void> {
        this._initialized = true;
        return super.initialize();
    }

    async createAPI(): Promise<AnyObject> {
        return {};
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }
}
