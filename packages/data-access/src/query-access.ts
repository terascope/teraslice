import { DataAccessConfig } from './manager';

/**
 * Using a DataAccess ACL, limit queries to
 * specific fields and records
*/
export class QueryAccess {
    constructor(acl: DataAccessConfig) {

    }

    /**
     * Given xlucene query it should be able to restrict
     * the query to certian fields and add any constraints.
     *
     * If the input query using restricted fields, it will throw a function.
    */
    restrictQuery(input: string): string {
        return input;
    }
}
