import { AnyObject } from '@terascope/utils';
import { OperationAPI } from '../../../../src/index.js';

export default class VersionAPI extends OperationAPI {
    async createAPI(): Promise<AnyObject> {
        return {
            version: '2.0.0'
        };
    }
}
