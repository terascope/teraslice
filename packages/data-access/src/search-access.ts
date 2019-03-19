import * as ts from '@terascope/utils';
import { SearchParams } from 'elasticsearch';
import { LuceneQueryAccess } from 'xlucene-evaluator';
import { DataAccessConfig } from './acl-manager';

/**
 * Using a DataAccess ACL, limit queries to
 * specific fields and records
 *
 * @todo move search code from the data-access-plugin here
*/
export class SearchAccess {
    config: DataAccessConfig;
    private _queryAccess: LuceneQueryAccess;

    constructor(config: DataAccessConfig) {
        if (!config.search_config || ts.isEmpty(config.search_config) || !config.search_config.index) {
            throw new ts.TSError('Search is not configured correctly for search');
        }

        this.config = config;

        this._queryAccess = new LuceneQueryAccess({
            excludes: this.config.view.excludes,
            includes: this.config.view.includes,
            constraint: this.config.view.constraint,
            prevent_prefix_wildcard: this.config.view.prevent_prefix_wildcard,
            type_config: this.config.data_type.type_config,
        });
    }

    /**
     * Given xlucene query it should be able to restrict
     * the query to certian fields and add any constraints.
     *
     * If the input query using restricted fields, it will throw.
    */
    restrictQuery(query: string, params?: SearchParams): SearchParams {
        const restricted = this._queryAccess.restrict(query);
        return this._queryAccess.toRestrictedSearchQuery(restricted, params);
    }
}
