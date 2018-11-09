import DataEntity, { DataInput } from '../data-entity';
import SlicerClass from '../slicer';
import operationAPIShim, { APIs } from './operation-api-shim';
import legacySliceEventsShim from './legacy-slice-events-shim';
import {
    ParallelSlicerConstructor,
    SingleSlicerConstructor,
    FetcherConstructor,
    SchemaConstructor,
} from '../interfaces';
import {
    Logger,
    SliceRequest,
    ReaderFn,
    SlicerFns,
    LegacyReader,
} from '../../interfaces';
import { WorkerContext } from '../../execution-context';
import { times } from '../../utils';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

type SlicerType = SingleSlicerConstructor|ParallelSlicerConstructor;
type FetcherType = FetcherConstructor;
type SchemaType = SchemaConstructor;

// tslint:disable-next-line:variable-name
export default function legacyReaderShim(Slicer: SlicerType, Fetcher: FetcherType, Schema: SchemaType, apis?: APIs): LegacyReader {
    return {
        // @ts-ignore
        Slicer,
        Fetcher,
        Schema,
        schema: (context) => {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            // @ts-ignore
            const schema = new Schema(context);
            return schema.schema;
        },
        async newReader(context, opConfig, executionConfig): Promise<ReaderFn<DataInput[]>> {
            const fetcher = new Fetcher(context as WorkerContext, opConfig, executionConfig);
            await fetcher.initialize();

            legacySliceEventsShim(fetcher);

            operationAPIShim(context, apis);

            return async (sliceRequest: SliceRequest): Promise<DataInput[]> => {
                const output = await fetcher.handle(sliceRequest);
                return DataEntity.makeArray(output);
            };
        },
        async newSlicer(context, executionContext, recoveryData: object[], logger: Logger): Promise<SlicerFns> {
            const executionConfig = executionContext.config;
            const opConfig = executionConfig.operations[0];

            // @ts-ignore
            const slicer = new Slicer(context, opConfig, executionConfig);

            // @ts-ignore
            slicer.logger = logger;

            await slicer.initialize(recoveryData);

            slicer.events.once('worker:shutdown', async () => {
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
