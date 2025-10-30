import { ParallelSlicer } from '@terascope/job-components';
import { pDelay } from '@terascope/core-utils';

export default class Counter extends ParallelSlicer<Record<string, any>> {
    count = 0;

    async newSlicer(id: number): Promise<() => Promise<({
        count: number;
        id: number;
    } | null)>> {
        let count = 3;
        return async () => {
            const delay = Math.round(100 * Math.random());
            await pDelay(delay);
            count -= 1;
            if (count <= 0) return null;
            return { count, id };
        };
    }
}
