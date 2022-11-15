import { Slicer } from '@terascope/job-components';

export default class ExampleSlicer extends Slicer {
    async initialize(recoveryData) {
        this.initialized = true;
        return super.initialize(recoveryData);
    }

    async shutdown() {
        this.shutdown = true;
        return super.shutdown();
    }

    async slice() {
        return {
            id: (Math.random() * 10000) + (Math.random() * 10000),
            fetchFrom: 'https://httpstat.us/200'
        };
    }
}
