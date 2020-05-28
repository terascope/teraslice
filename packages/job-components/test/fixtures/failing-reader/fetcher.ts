import { Fetcher, DataEntity } from '../../../src';

export default class FailingFetcher extends Fetcher {
    async fetch() {
        return [
            // @ts-expect-error
            DataEntity.fromBuffer(JSON.stringify({ hello: true }), this.opConfig),
            // @ts-expect-error
            DataEntity.fromBuffer(JSON.stringify({ hi: true }), this.opConfig),
            // @ts-expect-error
            DataEntity.fromBuffer('{"thiswill":fail}', this.opConfig),
        ];
    }
}
