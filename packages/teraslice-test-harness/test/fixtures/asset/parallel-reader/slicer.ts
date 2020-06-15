/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ParallelSlicer, AnyObject, pDelay } from '@terascope/job-components';

export default class Counter extends ParallelSlicer<AnyObject> {
    count = 0;

    async newSlicer(id: number) {
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
