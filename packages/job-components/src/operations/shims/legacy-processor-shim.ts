import operationAPIShim, { APIs } from './operation-api-shim';
import legacySliceEventsShim from './legacy-slice-events-shim';
import DataEntity, { DataInput } from '../data-entity';
import { SchemaConstructor } from '../core/schema-core';
import { ProcessorConstructor } from '../core/processor-core';
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
export default function legacyProcessorShim(Processor: ProcessorConstructor, Schema: SchemaConstructor, apis?: APIs): LegacyProcessor {
    return {
        schema: (context) => {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            // @ts-ignore
            const schema = new Schema(context);
            return schema.schema;
        },
        async newProcessor(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig): Promise<processorFn<DataInput[]>> {
            const processor = new Processor(context, opConfig, executionConfig);
            await processor.initialize();

            legacySliceEventsShim(processor);

            operationAPIShim(context, apis);

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
