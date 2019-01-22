import { DataAccessConfig } from './manager';

/**
 * Using a DataAccess ACL, filter access to specific
 * records and fields
*/
export class FilterAccess<T extends object> {
    constructor(acl: DataAccessConfig) {

    }

    filter(incoming: T[]): T[] {
        return incoming;
    }
}
