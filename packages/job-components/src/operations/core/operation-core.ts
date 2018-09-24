import _ from 'lodash';
import convict from 'convict';
import Core from './core';
import { validateOpConfig } from '../../config-validators';
import { OpConfig } from '@terascope/teraslice-types';
import DataEntity, {
    DataEntityList,
    DataArrayInput,
    DataInput,
    DataListInput,
    toDataEntity,
    toDataEntities,
    toDataEntityList
} from '../data-entity';

/**
 * A base class for supporting operations that run on a "Worker",
 * that supports the job execution lifecycle events.
 * This class will likely not be used externally
 * since Teraslice only supports a few types varients based on this class.
 * @see Core
 */

export default class OperationCore extends Core {
    /**
     * This is called by the Teraslice framework in-order to delegrate the
     * the schema validation to place that can be customized depending on
     * the operations need.
     * In the case of "Reader" the "Slicer" and "Fetcher" schema are shared
     * but the "Fetcher" is the operation that will handle the validation
    */
    static async validate(inputSchema: convict.Schema<any>, inputConfig: any): Promise<OpConfig> {
        return validateOpConfig(inputSchema, inputConfig);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous slice initialization before the slice
     * has been handed to any operation.
    */
    async onSliceInitialized(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous preperation after the slice is sent
     * to the "Fetcher"
    */
    async onSliceStarted(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice started: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup after the slice is done
     * with the last operation
    */
    async onSliceFinalizing(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice finalizing: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup after the slice has
     * been acknowledged by the "Execution Controller"
    */
    async onSliceFinished(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice finished: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup after the slice has
     * been marked as "Failed"
    */
    async onSliceFailed(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice failed: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup, or setup, after the slice has
     * been failed to process and the `max_retries` is set a number
     * greater than 1.
    */
    async onSliceRetry(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice retry: ${sliceId}`);
    }

    /**
     * Convert an input to a DataEntity
     * @borrows toDataEntity as OperationCore#toDataEntity
    */
    toDataEntity(input: DataInput): DataEntity {
        return toDataEntity(input);
    }

    /**
     * Convert an input to an array of DataEntities
     * @borrows toDataEntities as OperationCore#toDataEntities
    */
    toDataEntities(input: DataArrayInput): DataEntity[] {
        return toDataEntities(input);
    }

    /**
     * Convert an input to an List of DataEntities
     * @borrows toDataEntityList as OperationCore#toDataEntityList
    */
    toDataEntityList(input: DataListInput): DataEntityList {
        return toDataEntityList(input);
    }
}
