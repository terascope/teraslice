import { Context, LegacyProcessor, SliceRequest, ProcessorFn, ValidatedJobConfig } from '../../interfaces';
import DataEntity from '../data-entity';
import ProcessorCore from '../core/processor-core';
import ConvictSchema from '../convict-schema';
import { ProcessorModule } from '../interfaces';
import { convertResult } from './shim-utils';
import { toString } from '../../utils';

export default function processorShim<S = any>(legacy: LegacyProcessor): ProcessorModule {
    return {
        Processor: class LegacyProcessorShim<T = object> extends ProcessorCore<T> {
            private processorFn: ProcessorFn<DataEntity[]>|undefined;

            async initialize() {
                this.processorFn = await legacy.newProcessor(this.context, this.opConfig, this.executionConfig);
            }

            async handle(input: DataEntity[], sliceRequest: SliceRequest): Promise<DataEntity[]> {
                if (this.processorFn != null) {
                    const result = await this.processorFn(input, this.logger, sliceRequest);
                    try {
                        // @ts-ignore
                        return convertResult(result);
                    } catch (err) {
                        throw new Error(`${this.opConfig._op} failed to convert result: ${toString(err)}`);
                    }
                }

                throw new Error('Processor has not been initialized');
            }
        },
        Schema: class LegacySchemaShim extends ConvictSchema<S> {
            // @ts-ignore
            validate(inputConfig: any) {
                const opConfig = super.validate(inputConfig);
                if (legacy.selfValidation) {
                    // @ts-ignore
                    legacy.selfValidation(opConfig);
                }
                return opConfig;
            }

            validateJob(job: ValidatedJobConfig): void {
                if (legacy.crossValidation) {
                    legacy.crossValidation(job, this.context.sysconfig);
                }
            }

            build(context?: Context) {
                return legacy.schema(context);
            }
        }
    };
}
