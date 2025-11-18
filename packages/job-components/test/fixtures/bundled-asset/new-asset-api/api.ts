import { OperationAPI } from '../../../../src/index.js';

export class AssetExampleAPI extends OperationAPI {
    _initialized = false;
    _shutdown = false;
    readonly newAssetApi = true;

    async initialize(): Promise<void> {
        this._initialized = true;
        return super.initialize();
    }

    async createAPI(): Promise<Record<string, any>> {
        return {};
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }
}
