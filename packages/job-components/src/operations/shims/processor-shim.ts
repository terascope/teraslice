import { Context, OpConfig, LegacyProcessor, SliceRequest, processorFn } from '@terascope/teraslice-types';
import DataEntity, { DataEntityList } from '../data-entity';
import ProcessorCore, { ProcessorConstructor } from '../core/processor-core';
import { SchemaConstructor } from '../core/schema-core';
import ConvictSchema from '../convict-schema';

export default function processorShim(legacy: LegacyProcessor): ProcessorModule {
    return {
        Processor: class LegacyProcessorShim extends ProcessorCore {
            private processorFn: processorFn<DataEntity[]>|undefined;

            async initialize() {
                this.processorFn = await legacy.newProcessor(this.context, this.opConfig, this.executionConfig);
            }

            async handle(input: DataEntityList, sliceRequest: SliceRequest): Promise<DataEntityList> {
                if (this.processorFn != null) {
                    const result = await this.processorFn(input.toArray(), this.logger, sliceRequest);
                    return DataEntity.makeList(result);
                }

                throw new Error('Processor has not been initialized');
            }
        },
        Schema: class LegacySchemaShim extends ConvictSchema {
            validate(inputConfig: any): OpConfig {
                const opConfig = super.validate(inputConfig);
                if (legacy.selfValidation) {
                    legacy.selfValidation(opConfig);
                }
                return opConfig;
            }

            build(context?: Context) {
                return legacy.schema(context);
            }
        }
    };
}

interface ProcessorModule {
    Processor: ProcessorConstructor;
    Schema: SchemaConstructor;
}
