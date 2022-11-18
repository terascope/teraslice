/* eslint-disable max-classes-per-file */

import {
    DataEntity, isInteger, isFunction, toString
} from '@terascope/utils';
import {
    Context,
    LegacyExecutionContext,
    LegacyReader,
    SliceRequest,
    SlicerFns,
    ReaderFn,
    ValidatedJobConfig,
    SlicerRecoveryData,
} from '../../interfaces';
import FetcherCore from '../core/fetcher-core';
import ParallelSlicer from '../parallel-slicer';
import ConvictSchema from '../convict-schema';
import { ReaderModule } from '../interfaces';
import { convertResult } from './shim-utils';

export default function readerShim<S extends Record<string, any>>(
    legacy: LegacyReader
): ReaderModule {
    return {
        Slicer: class LegacySlicerShim<T = Record<string, any>> extends ParallelSlicer<T> {
            private _maxQueueLength = 10000;
            private _dynamicQueueLength = false;
            private slicerFns: SlicerFns | undefined;

            /** legacy slicers should recoverable by default */
            isRecoverable(): boolean {
                return true;
            }

            async initialize(recoveryData: SlicerRecoveryData[]): Promise<void> {
                const executionContext = {
                    config: this.executionConfig,
                } as LegacyExecutionContext;

                if (isFunction(legacy.slicerQueueLength)) {
                    const result = await legacy.slicerQueueLength(executionContext);
                    if (result === 'QUEUE_MINIMUM_SIZE') {
                        this._maxQueueLength = this.executionConfig.workers;
                        this._dynamicQueueLength = true;
                    } else if (isInteger(result) && result > 0) {
                        this._maxQueueLength = result;
                    }
                }

                this.slicerFns = await legacy.newSlicer(
                    this.context,
                    executionContext,
                    recoveryData,
                    this.logger
                );

                await super.initialize(recoveryData);
            }

            async newSlicer() {
                if (this.slicerFns == null) {
                    throw new Error('Slicer has not been initialized');
                }
                return this.slicerFns.shift();
            }

            maxQueueLength() {
                if (this._dynamicQueueLength) {
                    return this.workersConnected;
                }
                return this._maxQueueLength;
            }
        },
        Fetcher: class LegacyFetcherShim<T = Record<string, any>> extends FetcherCore<T> {
            private fetcherFn: ReaderFn<DataEntity[]> | undefined;

            async initialize(): Promise<void> {
                this.fetcherFn = await legacy.newReader(
                    this.context,
                    this.opConfig,
                    this.executionConfig
                );
            }

            async handle(sliceRequest: SliceRequest): Promise<DataEntity[]> {
                if (this.fetcherFn) {
                    const result = await this.fetcherFn(sliceRequest, this.logger);
                    try {
                        return convertResult(result);
                    } catch (err) {
                        throw new Error(`${this.opConfig._op} failed to convert result: ${toString(err)}`);
                    }
                }

                throw new Error('Fetcher has not been initialized');
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
        },
    };
}
