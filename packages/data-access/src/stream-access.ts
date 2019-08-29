import { DataAccessConfig } from './interfaces';

/**
 * Using a DataAccess ACL, filter access to specific
 * records and fields
 *
 * @todo implement this
*/
export class StreamAccess<T extends object> {
    constructor(_acl: DataAccessConfig) {

    }

    filter(incoming: T[]): T[] {
        return incoming;
    }
}
