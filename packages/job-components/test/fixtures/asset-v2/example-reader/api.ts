import { OperationAPI, AnyObject } from '../../../../src';

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

    async createAPI(): Promise<AnyObject> {
        return {};
    }

    name(): string {
        return 'ExampleAPI';
    }

    async handle(config: unknown): Promise<any> {
        return {
            config,
            say() {
                return 'hello';
            }
        };
    }
}
