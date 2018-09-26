import times from 'lodash/times';
import SlicerClass, { SlicerConstructor } from '../slicer';
import { ParallelSlicerConstructor } from '../parallel-slicer';
import { FetcherConstructor } from '../core/fetcher-core';
import { SchemaConstructor } from '../core/schema-core';
import DataEntity, { DataInput } from '../data-entity';
import {
    Logger,
    Context,
    OpConfig,
    ExecutionConfig,
    SliceRequest,
    readerFn,
    slicerFns,
    LegacyReader,
    ExecutionContext,
} from '@terascope/teraslice-types';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

// tslint:disable-next-line:variable-name
export default function legacyReaderShim(Slicer: SlicerConstructor|ParallelSlicerConstructor, Fetcher: FetcherConstructor, Schema: SchemaConstructor): LegacyReader {
    return {
        schema: (context) => {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            const schema = new Schema();
            return schema.build(context);
        },
        async newReader(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig): Promise<readerFn<DataInput[]>> {
            const fetcher = new Fetcher(context, opConfig, executionConfig);
            await fetcher.initialize();

            const events = context.apis.foundation.getSystemEvents();
            events.once('worker:shutdown', async () => {
                await fetcher.shutdown();
            });

            events.once('slice:initialize', async (slice) => {
                await fetcher.onSliceInitialized(slice.slice_id);
            });

            events.once('slice:retry', async (slice) => {
                await fetcher.onSliceRetry(slice.slice_id);
            });

            events.once('slice:failure', async (slice) => {
                await fetcher.onSliceFailed(slice.slice_id);
            });

            events.once('slice:success', async (slice) => {
                await fetcher.onSliceFinalizing(slice.slice_id);
            });

            events.once('slice:finalize', async (slice) => {
                await fetcher.onSliceFinished(slice.slice_id);
            });

            return async (sliceRequest: SliceRequest): Promise<DataInput[]> => {
                const output = await fetcher.handle(sliceRequest);
                return DataEntity.makeArray(output);
            };
        },
        async newSlicer(context: Context, executionContext: ExecutionContext, recoveryData: object[], logger: Logger): Promise<slicerFns> {
            const executionConfig = executionContext.config;
            const opConfig = executionConfig.operations[0];

            const slicer = new Slicer(context, opConfig, executionConfig);

            // @ts-ignore
            slicer.logger = logger;

            await slicer.initialize(recoveryData);

            const events = context.apis.foundation.getSystemEvents();
            events.once('worker:shutdown', async () => {
                await slicer.shutdown();
            });

            if (slicer instanceof SlicerClass) {
                return [
                    () => slicer.slice()
                ];
            }

            const slicers = times(executionConfig.slicers, () => {
                return slicer.newSlicer();
            });

            return Promise.all(slicers);
        }
    };
}
