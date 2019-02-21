import { DataAccessConfig } from './acl-manager';
import { LuceneQueryAccess } from 'xlucene-evaluator';

/**
 * Using a DataAccess ACL, limit queries to
 * specific fields and records
 *
 * @todo should be able to translate to a full elasticsearch query
*/
export class QueryAccess {
    acl: DataAccessConfig;
    private _queryAccess: LuceneQueryAccess;

    constructor(acl: DataAccessConfig) {
        this.acl = acl;
        const {
            excludes = [],
            includes = [],
            constraint,
            prevent_prefix_wildcard
        } = acl.view;

        this._queryAccess = new LuceneQueryAccess({
            excludes,
            includes,
            constraint,
            prevent_prefix_wildcard,
        });
    }

    /**
     * Given xlucene query it should be able to restrict
     * the query to certian fields and add any constraints.
     *
     * If the input query using restricted fields, it will throw.
    */
    restrictQuery(query: string): string {
        return this._queryAccess.restrict(query);
    }
}
