import { AnyObject } from '@terascope/core-utils';
import { OperationAPI } from '../../../../src/index.js';

export default class VersionAPI extends OperationAPI {
    async createAPI(): Promise<AnyObject> {
        return {
            version: '1.0.0'
        };
    }
}
