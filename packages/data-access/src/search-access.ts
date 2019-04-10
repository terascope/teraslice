import * as ts from '@terascope/utils';
import { QueryAccess } from 'xlucene-evaluator';
import { DataAccessConfig } from './acl-manager';
import { SearchParams } from 'elasticsearch';

/**
 * Using a DataAccess ACL, limit queries to
 * specific fields and records
 *
 * @todo move search code from the data-access-plugin here
*/
export class SearchAccess {
    config: DataAccessConfig;
    private _queryAccess: QueryAccess;

    constructor(config: DataAccessConfig) {
        if (!config.search_config || ts.isEmpty(config.search_config) || !config.search_config.index) {
            throw new ts.TSError('Search is not configured correctly for search');
        }

        this.config = config;

        this._queryAccess = new QueryAccess({
            convert_empty_query_to_wildcard: true,
            excludes: this.config.view.excludes,
            includes: this.config.view.includes,
            constraint: this.config.view.constraint,
            prevent_prefix_wildcard: this.config.view.prevent_prefix_wildcard,
            type_config: this.config.data_type.type_config,
        });
    }

    /**
     * Converts a restricted xlucene query to an elasticsearch search query
    */
    restrictSearchQuery(query: string, params?: SearchParams): SearchParams {
        return this._queryAccess.restrictSearchQuery(query, params);
    }
}
