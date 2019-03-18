import { DataAccessConfig } from './acl-manager';

/**
 * Using a DataAccess ACL, filter access to specific
 * records and fields
 *
 * @todo this should be renamed to StreamAccess
*/
export class FilterAccess<T extends object> {
    constructor(acl: DataAccessConfig) {

    }

    filter(incoming: T[]): T[] {
        return incoming;
    }
}
