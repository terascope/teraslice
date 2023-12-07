import { ParallelSlicer, pDelay, times } from '@terascope/job-components';

export default class ExampleSlicer extends ParallelSlicer {
    async newSlicer(id: number) {
        const { countPerSlicer } = this.opConfig;
        const records = times(countPerSlicer, (i) => ({ id: `slicer-${id}-${i}` }));

        return async (): Promise<any> => {
            await pDelay(0);
            return records.shift();
        };
    }
}
