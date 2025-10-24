import { DataEntity } from '@terascope/entity-utils';
import { Fetcher } from '../../../../src/index.js';

export default class VersionedFetcher extends Fetcher {
    async fetch(): Promise<DataEntity[]> {
        const result = [];
        for (let i = 0; i < 10; i++) {
            result.push({
                id: i,
                data: [Math.random(), Math.random(), Math.random()],
                version: '2.0.0'
            });
        }
        return result as any[];
    }
}
