import { DataEntityList } from '../data-entity';
import { OperationCore } from './operation-core';
import { SliceRequest } from '@terascope/teraslice-types';

/**
 * Processor [DRAFT]
 * @description A base class for supporting "Processors" that run on a "Worker".
 *              A "Processor" cannot be the first operation in the job configuration.
 *              This class will likely not be used externally
 *              since Teraslice only supports a few types varients based on this class.
 */

export abstract class ProcessorCore extends OperationCore {
    /**
     * @description this is called by the Teraslice framework.
     *              Each type of varient of a "Processor" will need
     *              to implement their own version of this
    */
    abstract async handle(input: DataEntityList, sliceRequest?: SliceRequest): Promise<DataEntityList>;
}
