import { ParallelSlicer } from '@terascope/job-components';
import { get } from '@terascope/core-utils';

const defaultSlicerResults = [{ howdy: true }, null];

export default class ExampleSlicer extends ParallelSlicer {
    async newSlicer(_id: number) {
        const slicerResults = get(this.opConfig, 'slicerResults', defaultSlicerResults);
        const errorAt = get(this.opConfig, 'slicerErrorAt', []);
        const updateMetadata = get(this.opConfig, 'updateMetadata', false);

        // @ts-expect-error
        if (!this.context._slicerCalls) {
            // @ts-expect-error
            this.context._slicerCalls = -1;
        }

        let sliceCalls = 0;

        return async () => {
            // @ts-expect-error
            this.context._slicerCalls += 1;

            // @ts-expect-error
            if (errorAt.includes(this.context._slicerCalls)) {
                return Promise.reject(new Error('Bad news bears'));
            }

            const result = slicerResults.shift() as any;
            sliceCalls++;
            if (updateMetadata) {
                await this.context.apis.executionContext.setMetadata(
                    'slice_calls',
                    sliceCalls
                );
            }
            if (result && result.error) {
                throw new Error(result.error);
            }
            return result;
        };
    }

    isRecoverable(): boolean {
        return true;
    }
}
