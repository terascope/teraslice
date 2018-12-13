import { OperationAPI } from '@terascope/job-components';
import { SimpleAPIConfig, SimpleAPI } from './interfaces';

export default class SimpleOperationAPI extends OperationAPI<SimpleAPIConfig> {
    async createAPI() {
        return {
            count: 0,
            add(n: number = 1) {
                this.count += n;
            },
            sub(n: number = 1) {
                this.count += n;
            },
        } as SimpleAPI;
    }
}
