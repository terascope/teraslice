import { ParallelSlicer, pDelay, times } from '@terascope/job-components';

export default class ExampleSlicer extends ParallelSlicer {
    async newSlicer(id) {
        const { countPerSlicer } = this.opConfig;
        const records = times(countPerSlicer, (i) => ({ id: `slicer-${id}-${i}` }));

        return async () => {
            await pDelay(0);
            return records.shift();
        };
    }
}
