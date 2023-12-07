import { Fetcher } from '@terascope/job-components';

export default class ExampleFetcher extends Fetcher {
    async fetch() {
        const { countPerFetch } = this.opConfig;

        const result: any[] = [];

        for (let i = 0; i < countPerFetch; i++) {
            result.push({
                id: i,
                data: [
                    Math.random(),
                    Math.random(),
                    Math.random(),
                ]
            });
        }

        return result;
    }
}
