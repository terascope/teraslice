import { DataEntity, DataInput, Logger, times, isFunction } from '@terascope/utils';
import SlicerClass from '../slicer';
import operationAPIShim, { APIs } from './operation-api-shim';
import legacySliceEventsShim from './legacy-slice-events-shim';
import {
    SchemaConstructor,
} from '../interfaces';
import {
    SliceRequest,
    ReaderFn,
    SlicerFns,
    LegacyReader,
    WorkerContext,
} from '../../interfaces';
import ConvictSchema from '../convict-schema';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

type SchemaType = SchemaConstructor;

// tslint:disable-next-line:variable-name
export default function legacyReaderShim(Slicer: any, Fetcher: any, Schema: SchemaType, apis?: APIs): LegacyReader {
    let schema: ConvictSchema<any, any>|undefined;

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
            schema = new Schema(context);
            // @ts-ignore
            return schema.schema;
        },
        crossValidation: (job, sysconfig) => {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            // @ts-ignore
            const _schema = schema || new Schema({ sysconfig });
            if (isFunction(_schema.validateJob)) {
                _schema.validateJob(job);
            }
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
