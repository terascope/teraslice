import { ProcessorConstructor } from '../core/processor-core';
import { SchemaConstructor } from '../core/schema-core';
import DataEntity, { DataInput } from '../data-entity';
import {
    LegacyProcessor,
    Logger,
    Context,
    OpConfig,
    ExecutionConfig,
    SliceRequest,
    processorFn,
} from '@terascope/teraslice-types';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

// tslint:disable-next-line:variable-name
export default function legacyProcessorShim(Processor: ProcessorConstructor, Schema: SchemaConstructor): LegacyProcessor {
    return {
        schema: (context) => {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            const schema = new Schema();
            return schema.build(context);
        },
        async newProcessor(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig): Promise<processorFn<DataInput[]>> {
            const processor = new Processor(context, opConfig, executionConfig);
            await processor.initialize();

            const events = context.apis.foundation.getSystemEvents();
            events.once('worker:shutdown', async () => {
                await processor.shutdown();
            });

            events.once('slice:initialize', async (slice) => {
                await processor.onSliceInitialized(slice.slice_id);
            });

            events.once('slice:retry', async (slice) => {
                await processor.onSliceRetry(slice.slice_id);
            });

            events.once('slice:failure', async (slice) => {
                await processor.onSliceFailed(slice.slice_id);
            });

            events.once('slice:success', async (slice) => {
                await processor.onSliceFinalizing(slice.slice_id);
            });

            events.once('slice:finalize', async (slice) => {
                await processor.onSliceFinished(slice.slice_id);
            });

            return async (input: DataInput[], logger: Logger, sliceRequest: SliceRequest): Promise<DataInput[]> => {
                // @ts-ignore
                processor.logger = logger;

                const data = DataEntity.makeList(input);

                const output = await processor.handle(data, sliceRequest);
                return DataEntity.makeArray(output);
            };
        }
    };
}
