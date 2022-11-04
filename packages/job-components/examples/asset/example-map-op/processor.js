import { MapProcessor } from '@terascope/job-components';

export default class ExampleMap extends MapProcessor {
    map(data) {
        data.touchedAt = new Date().toISOString();
        return data;
    }
}
