import { BatchProcessor } from '@terascope/job-components';

export default class Summarize extends BatchProcessor {
    async initialize() {
        this.logger.debug('summarizing...');
    }

    onBatch(data) {
        // Collect the data types we're interested in
        const urls = {};
        const ips = {};

        for (const item of data) {
            this.countKey(urls, item.url);
            this.countKey(ips, item.ip);
        }

        // flatten into the records we'll index
        const result = [];

        Object.entries(urls).forEach(([url, record]) => {
            result.push({
                _key: url,
                type: 'url',
                count: record,
                first_seen: new Date(),
                last_seen: new Date()
            });
        });

        Object.entries(ips).forEach(([ip, record]) => {
            result.push({
                _key: ip,
                type: 'ip',
                count: record,
                first_seen: new Date(),
                last_seen: new Date()
            });
        });

        return result;
    }

    countKey(collection, key) {
        if (!Object.hasOwnProperty.call(collection, key)) {
            collection[key] = 1;
        } else {
            collection[key]++;
        }
    }
}
