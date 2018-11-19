import DataEntity from '../data-entity';
import OperationCore from './operation-core';
import { SliceRequest, OpConfig } from '../../interfaces';

/**
 * A base class for supporting "Processors" that run on a "Worker".
 * A "Processor" cannot be the first operation in the job configuration.
 * This class will likely not be used externally
 * since Teraslice only supports a few types varients based on this class.
 * @see OperationCore
 */

export default abstract class ProcessorCore<T = OpConfig> extends OperationCore<T> {
    /**
    * A generic method called by the Teraslice framework to a give a "Processor"
    * the ability to handle the input and output of operation
    * @param input an array of DataEntities
    * @returns an array of DataEntities
    */
    abstract async handle(input: DataEntity[], sliceRequest?: SliceRequest): Promise<DataEntity[]>;
}
