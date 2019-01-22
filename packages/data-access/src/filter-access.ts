import { DataAccessACL } from './admin';

/**
 * Using a DataAccess ACL, filter access to specific
 * records and fields
*/
export class FilterAccess<T extends object> {
    constructor(acl: DataAccessACL) {

    }

    filter(incoming: T[]): T[] {
        return incoming;
    }
}
