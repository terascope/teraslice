import { DataEntity } from '../data-entity';
import { OperationCore } from './operation-core';

/**
 * ProcessCore [DRAFT]
 * @description One of the main types of an Operations for processing data.
 */

export abstract class ProcessorCore extends OperationCore {
    // this method is called by the teraslice framework
    // this is for the Processor subclass
    abstract async handle(input: DataEntity[]): Promise<DataEntity[]>;
}
