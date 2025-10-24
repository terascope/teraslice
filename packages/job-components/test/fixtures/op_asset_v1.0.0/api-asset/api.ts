
import { OperationAPI } from '../../../../src/index.js';

export default class VersionAPI extends OperationAPI {
    async createAPI(): Promise<Record<string, any>> {
        return {
            version: '1.0.0'
        };
    }
}
