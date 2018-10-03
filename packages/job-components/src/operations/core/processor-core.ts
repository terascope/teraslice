import { DataEntityList } from '../data-entity';
import OperationCore from './operation-core';
import { SliceRequest, Context, OpConfig, ExecutionConfig } from '@terascope/teraslice-types';

/**
 * A base class for supporting "Processors" that run on a "Worker".
 * A "Processor" cannot be the first operation in the job configuration.
 * This class will likely not be used externally
 * since Teraslice only supports a few types varients based on this class.
 * @see OperationCore
 */

export default abstract class ProcessorCore extends OperationCore {
    /**
    * A generic method called by the Teraslice framework to a give a "Processor"
    * the ability to handle the input and output of operation
    * @param input an immutable list of DataEntities
    * @returns an immutable list of DataEntities
    */
    abstract async handle(input: DataEntityList, sliceRequest?: SliceRequest): Promise<DataEntityList>;
}

export type ProcessorConstructor = {
    new(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig): ProcessorCore;
};
