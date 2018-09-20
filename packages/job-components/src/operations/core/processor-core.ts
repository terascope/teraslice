import { DataEntity } from '../data-entity';
import { OperationCore } from './operation-core';
import { SliceRequest } from '@terascope/teraslice-types';

/**
 * ProcessCore [DRAFT]
 * @description One of the main types of an Operations for processing data.
 */

export abstract class ProcessorCore extends OperationCore {
    /**
     * @description this is called by the Teraslice framework
     * @returns an array of DataEntities
    */
    abstract async handle(input: DataEntity[], sliceRequest?: SliceRequest): Promise<DataEntity[]>;
}
