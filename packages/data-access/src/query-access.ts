import { DataAccessACL } from './admin';

/**
 * Using a DataAccess ACL, limit queries to
 * specific fields and records
*/
export class QueryAccess {
    constructor(acl: DataAccessACL) {

    }

    restrictQuery(input: string): string {
        return input;
    }
}
