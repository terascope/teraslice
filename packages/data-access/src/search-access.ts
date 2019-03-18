import * as ts from '@terascope/utils';
import defaultsDeep from 'lodash.defaultsdeep';
import { SearchParams } from 'elasticsearch';
import { LuceneQueryAccess, Translator } from 'xlucene-evaluator';
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

        const {
            excludes = [],
            includes = [],
            constraint,
            prevent_prefix_wildcard
        } = this.config.view;

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
    restrictQuery(query: string, params: SearchParams = {}): SearchParams {
        if (params._source) {
            throw new ts.TSError('Cannot include _source in params, use _sourceInclude or _sourceExclude');
        }

        const restricted = this._queryAccess.restrict(query);

        const body = Translator.toElasticsearchDSL(restricted, this.config.data_type.type_config);

        const _sourceInclude = getSourceFields(this.config.view.includes, params._sourceInclude);
        const _sourceExclude = getSourceFields(this.config.view.excludes, params._sourceExclude);

        const searchParams = defaultsDeep({}, params, {
            body,
            _sourceInclude,
            _sourceExclude
        });

        if (searchParams.q) {
            delete searchParams.q;
        }

        return searchParams;
    }

}

export function getSourceFields(restricted?: string[], override?: string[]|boolean|string): string[]|undefined {
    if (restricted && override) {
        const fields = ts.uniq(ts.parseList(override));

        for (const field of restricted) {
            const index = fields.indexOf(field);
            delete fields[index];
        }

        return [...fields];
    }
    if (override) {
        return [];
    }

    return restricted;
}

export type SearchParamsDefaults = Partial<ts.Omit<SearchParams, 'body'|'_sourceExclude'|'_sourceInclude'|'_source'>>;
