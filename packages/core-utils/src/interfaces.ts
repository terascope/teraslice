import type { DataEntity } from './entities/data-entity.js';

/**
 * Used for sending data to particular index/topic/file/table in a storage system.
 * This is used by the routed sender in the standard-assets
*/
export interface RouteSenderAPI {
    /**
     * Sends the records to the respective storage backend
     *
     * @returns the number of affected records/rows
    */
    send(records: Iterable<DataEntity>): Promise<number>;

    /**
     * This is used to verify and create an resources
     * required for this particular route
     *
     * This is optional to implement
    */
    verify?(route?: string): Promise<void>;
}
