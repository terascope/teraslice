import { APIFactory } from '../../../../src/index.js';

export default class ExampleAPIFactory extends APIFactory<
    Record<string, any>, Record<string, any>
> {
    _initialized = false;
    _shutdown = false;
    _removedWasCalled = false;

    async initialize(): Promise<void> {
        this._initialized = true;
        return super.initialize();
    }

    async create(
        name: string, config: Record<string, any>
    ): Promise<{ client: Record<string, any>; config: Record<string, any> }> {
        return { client: { name, config }, config };
    }

    async remove(_name: string): Promise<void> {
        this._removedWasCalled = true;
    }

    async shutdown(): Promise<void> {
        this._shutdown = true;
        return super.shutdown();
    }
}
