import {
    DataEntity, DataInput, Logger,
    times, isFunction
} from '@terascope/utils';
import SlicerClass from '../slicer.js';
import operationAPIShim, { APIs } from './operation-api-shim.js';
import legacySliceEventsShim from './legacy-slice-events-shim.js';
import { SchemaConstructor } from '../interfaces.js';
import {
    SliceRequest, ReaderFn, SlicerFns, LegacyReader,
    WorkerContext, SlicerRecoveryData, Context,
    ValidatedJobConfig, SysConfig, ExecutionConfig,
    LegacyExecutionContext,
} from '../../interfaces/index.js';
import ConvictSchema from '../convict-schema.js';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

type SchemaType = SchemaConstructor;

export default function legacyReaderShim(
    Slicer: unknown,
    Fetcher: unknown,
    Schema: SchemaType,
    apis?: APIs
): LegacyReader {
    let schema: ConvictSchema<any, any>|undefined;

    return {
        // @ts-expect-error
        Slicer,
        Fetcher,
        Schema,
        schema(context: Context): any {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            // @ts-expect-error
            schema = new Schema(context);
            // @ts-expect-error
            return schema.schema;
        },
        crossValidation(job: ValidatedJobConfig, sysconfig: SysConfig): void {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            // @ts-expect-error
            const _schema = schema || new Schema({ sysconfig });
            if (isFunction(_schema.validateJob)) {
                _schema.validateJob(job);
            }
        },
        async newReader(
            context: Context, opConfig: Record<string, any>, executionConfig: ExecutionConfig
        ): Promise<ReaderFn<DataInput[]>> {
            const fetcher = new (Fetcher as any)(
                context as WorkerContext, opConfig, executionConfig
            );
            await fetcher.initialize();

            legacySliceEventsShim(fetcher);

            operationAPIShim(context, apis);

            return async (sliceRequest: SliceRequest): Promise<DataInput[]> => {
                const output = await fetcher.handle(sliceRequest);
                return DataEntity.makeArray(output);
            };
        },
        async newSlicer(
            context: Context,
            executionContext: LegacyExecutionContext,
            recoveryData: SlicerRecoveryData[],
            logger: Logger
        ): Promise<SlicerFns> {
            const executionConfig = executionContext.config;
            const opConfig = executionConfig.operations[0];

            const slicer = new (Slicer as any)(context, opConfig, executionConfig);

            slicer.logger = logger;

            await slicer.initialize(recoveryData);

            slicer.events.once('worker:shutdown', async () => {
                await slicer.shutdown();
            });

            if (slicer instanceof SlicerClass) {
                return [
                    (): any => slicer.slice()
                ];
            }

            const slicers = times(executionConfig.slicers, () => slicer.newSlicer());

            return Promise.all(slicers);
        }
    };
}
