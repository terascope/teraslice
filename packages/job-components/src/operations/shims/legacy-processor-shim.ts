import { DataEntity, DataInput, Logger, isFunction } from '@terascope/utils';
import operationAPIShim, { APIs } from './operation-api-shim';
import legacySliceEventsShim from './legacy-slice-events-shim';
import { SchemaConstructor } from '../interfaces';
import {
    LegacyProcessor,
    SliceRequest,
    ProcessorFn,
    WorkerContext,
} from '../../interfaces';
import ConvictSchema from '../convict-schema';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

// tslint:disable-next-line:variable-name
export default function legacyProcessorShim(Processor: any, Schema: SchemaConstructor, apis?: APIs): LegacyProcessor {
    let schema: ConvictSchema<any, any>|undefined;

    return {
        // @ts-ignore
        Processor,
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
        async newProcessor(context, opConfig, executionConfig): Promise<ProcessorFn<DataInput[]>> {
            const processor = new Processor(context as WorkerContext, opConfig, executionConfig);
            await processor.initialize();

            legacySliceEventsShim(processor);

            operationAPIShim(context, apis);

            return async (input: DataInput[], logger: Logger, sliceRequest: SliceRequest): Promise<DataInput[]> => {
                // @ts-ignore
                processor.logger = logger;

                const output = await processor.handle(DataEntity.makeArray(input), sliceRequest);
                return DataEntity.makeArray(output);
            };
        }
    };
}
