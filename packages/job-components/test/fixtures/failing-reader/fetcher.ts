import { Fetcher, DataEntity } from '../../..';

export default class FailingFetcher extends Fetcher {
    async fetch() {
        return [
            // @ts-ignore
            DataEntity.fromBuffer(JSON.stringify({ hello: true }), this.opConfig),
            // @ts-ignore
            DataEntity.fromBuffer(JSON.stringify({ hi: true }), this.opConfig),
            // @ts-ignore
            DataEntity.fromBuffer('{"thiswill":fail}', this.opConfig),
        ];
    }
}
