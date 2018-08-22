import { OperationCore } from './operation-core';

type APIFn = Function;
type APIInstance = { [method: string]: Function };
type API = APIFn | APIInstance;

export class OperationAPI extends OperationCore {
    // @ts-ignore
    public async createAPI(config?: object): Promise<API> {
        throw new Error('OperationAPI must implement a "createAPI" method');
    }
}
