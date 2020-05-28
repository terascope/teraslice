import { Fetcher, DataEntity } from '../../../src';

export default class FailingFetcher extends Fetcher {
    async fetch(): Promise<DataEntity[]> {
        return [
            DataEntity.fromBuffer(JSON.stringify({ hello: true }), this.opConfig),
            DataEntity.fromBuffer(JSON.stringify({ hi: true }), this.opConfig),
            DataEntity.fromBuffer('{"thiswill":fail}', this.opConfig),
        ];
    }
}
