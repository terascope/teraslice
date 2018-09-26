import times from 'lodash/times';
import sliceEventsShim from './slice-events-shim';
import { SchemaConstructor } from '../core/schema-core';
import { FetcherConstructor } from '../core/fetcher-core';
import { ParallelSlicerConstructor } from '../parallel-slicer';
import SlicerClass, { SlicerConstructor } from '../slicer';
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

            sliceEventsShim(context, fetcher);

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
