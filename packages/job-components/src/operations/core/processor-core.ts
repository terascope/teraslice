import { DataEntityList } from '../data-entity';
import { OperationCore } from './operation-core';
import { SliceRequest } from '@terascope/teraslice-types';

/**
 * A base class for supporting "Processors" that run on a "Worker".
 * A "Processor" cannot be the first operation in the job configuration.
 * This class will likely not be used externally
 * since Teraslice only supports a few types varients based on this class.
 * @see OperationCore
 */

export abstract class ProcessorCore extends OperationCore {
    /**
    * A generic method called by the Teraslice framework to a give a "Processor"
    * the ability to handle the input and output of operation
    */
    abstract async handle(input: DataEntityList, sliceRequest?: SliceRequest): Promise<DataEntityList>;
}
