import operationAPIShim, { APIs } from './operation-api-shim';
import legacySliceEventsShim from './legacy-slice-events-shim';
import DataEntity, { DataInput } from '../data-entity';
import { SchemaConstructor } from '../interfaces';
import { WorkerContext } from '../../execution-context';
import {
    LegacyProcessor,
    Logger,
    SliceRequest,
    ProcessorFn,
} from '../../interfaces';

// This file for backwards compatibility and functionality will be limited
// but it should allow you to write processors using the new way today

// tslint:disable-next-line:variable-name
export default function legacyProcessorShim(Processor: any, Schema: SchemaConstructor, apis?: APIs): LegacyProcessor {
    return {
        // @ts-ignore
        Processor,
        Schema,
        schema: (context) => {
            if (Schema.type() !== 'convict') {
                throw new Error('Backwards compatibility only works for "convict" schemas');
            }

            // @ts-ignore
            const schema = new Schema(context);
            return schema.schema;
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
