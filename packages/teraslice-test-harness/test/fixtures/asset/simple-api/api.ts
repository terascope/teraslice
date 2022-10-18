import { OperationAPI } from '@terascope/job-components';
import { SimpleAPIConfig, SimpleAPI } from './interfaces.js';

export default class SimpleOperationAPI extends OperationAPI<SimpleAPIConfig> {
    async createAPI(): Promise<SimpleAPI> {
        return {
            count: 0,
            add(n = 1): void {
                this.count += n;
            },
            sub(n = 1): void {
                this.count += n;
            },
        } as SimpleAPI;
    }
}
