import {
    DataEntity, DataInput, Logger, isFunction
} from '@terascope/utils';
import operationAPIShim, { APIs } from './operation-api-shim.js';
import legacySliceEventsShim from './legacy-slice-events-shim.js';
import { SchemaConstructor } from '../interfaces.js';
import {
    LegacyProcessor, SliceRequest, ProcessorFn,
    WorkerContext,
} from '../../interfaces/index.js';
import ConvictSchema from '../convict-schema.js';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

export default function legacyProcessorShim(
    Processor: unknown,
    Schema: SchemaConstructor,
    apis?: APIs
): LegacyProcessor {
    let schema: ConvictSchema<any, any>|undefined;

    return {
        // @ts-expect-error
        Processor,
        Schema,
        schema: (context) => {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            // @ts-expect-error
            schema = new Schema(context);
            // @ts-expect-error
            return schema.schema;
        },
        crossValidation: (job, sysconfig) => {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            // @ts-expect-error
            const _schema = schema || new Schema({ sysconfig });
            if (isFunction(_schema.validateJob)) {
                _schema.validateJob(job);
            }
        },
        async newProcessor(context, opConfig, executionConfig): Promise<ProcessorFn<DataInput[]>> {
            const processor = new (Processor as any)(
                context as WorkerContext, opConfig, executionConfig
            );
            await processor.initialize();

            legacySliceEventsShim(processor);

            operationAPIShim(context, apis);

            return async (
                input: DataInput[],
                logger: Logger,
                sliceRequest: SliceRequest
            ): Promise<DataInput[]> => {
                processor.logger = logger;

                const output = await processor.handle(DataEntity.makeArray(input), sliceRequest);
                return DataEntity.makeArray(output);
            };
        }
    };
}
