import { Context, OpConfig, ExecutionContext, LegacyReader, SliceRequest, slicerFns, readerFn } from '../../interfaces';
import DataEntity, { DataEntityList } from '../data-entity';
import { SlicerConstructor } from '../core/slicer-core';
import FetcherCore, { FetcherConstructor } from '../core/fetcher-core';
import ParallelSlicer from '../parallel-slicer';
import { SchemaConstructor } from '../core/schema-core';
import ConvictSchema from '../convict-schema';

export default function readerShim(legacy: LegacyReader): ReaderModule {
    return {
        Slicer: class LegacySlicerShim extends ParallelSlicer  {
            private slicerFns: slicerFns|undefined;

            async initialize(recoveryData: object[]) {
                // @ts-ignore
                const executionContext: ExecutionContext = {
                    config: this.executionConfig,
                };

                this.slicerFns = await legacy.newSlicer(this.context, executionContext, recoveryData, this.logger);

                await super.initialize(recoveryData);
            }

            async newSlicer() {
                if (this.slicerFns == null) {
                    throw new Error('Slicer has not been initialized');
                }
                const fn = this.slicerFns.shift();
                if (!fn) {
                    return async () => null;
                }
                return fn;
            }
        },
        Fetcher: class LegacyFetcherShim extends FetcherCore {
            private fetcherFn: readerFn<DataEntity[]>|undefined;

            async initialize() {
                this.fetcherFn = await legacy.newReader(this.context, this.opConfig, this.executionConfig);
            }

            async handle(sliceRequest: SliceRequest): Promise<DataEntityList> {
                if (this.fetcherFn) {
                    const result = await this.fetcherFn(sliceRequest);
                    return DataEntity.makeList(result);
                }

                throw new Error('Fetcher has not been initialized');
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

interface ReaderModule {
    Slicer: SlicerConstructor;
    Fetcher: FetcherConstructor;
    Schema: SchemaConstructor;
}
