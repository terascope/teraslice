/* eslint-disable max-classes-per-file */

import { toString, DataEntity } from '@terascope/utils';
import {
    Context, LegacyProcessor, SliceRequest,
    ProcessorFn, ValidatedJobConfig
} from '../../interfaces/index.js';
import ProcessorCore from '../core/processor-core.js';
import ConvictSchema from '../convict-schema.js';
import { ProcessorModule } from '../interfaces.js';
import { convertResult } from './shim-utils.js';

export default function processorShim<S extends Record<string, any>>(
    legacy: LegacyProcessor
): ProcessorModule {
    return {
        Processor: class LegacyProcessorShim<T = Record<string, any>> extends ProcessorCore<T> {
            private processorFn: ProcessorFn<DataEntity[]>|undefined;

            async initialize(): Promise<void> {
                this.processorFn = await legacy.newProcessor(
                    this.context,
                    this.opConfig,
                    this.executionConfig
                );
            }

            async handle(input: DataEntity[], sliceRequest: SliceRequest): Promise<DataEntity[]> {
                if (this.processorFn != null) {
                    const result = await this.processorFn(input, this.logger, sliceRequest);
                    try {
                        return convertResult(result);
                    } catch (err) {
                        throw new Error(`${this.opConfig._op} failed to convert result: ${toString(err)}`);
                    }
                }

                throw new Error('Processor has not been initialized');
            }
        },
        Schema: class LegacySchemaShim extends ConvictSchema<S> {
            validate(inputConfig: Record<string, any>): any {
                const opConfig = super.validate(inputConfig);
                if (legacy.selfValidation) {
                    // @ts-expect-error
                    legacy.selfValidation(opConfig);
                }
                return opConfig;
            }

            validateJob(job: ValidatedJobConfig): void {
                if (legacy.crossValidation) {
                    legacy.crossValidation(job, this.context.sysconfig);
                }
            }

            build(context?: Context): any {
                return legacy.schema(context);
            }
        }
    };
}
