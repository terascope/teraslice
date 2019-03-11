import { Omit, parseList, uniq, TSError } from '@terascope/utils';
import { SearchParams } from 'elasticsearch';
import defaultsDeep from 'lodash.defaultsdeep';
import { LuceneQueryAccess, Translator, TypeConfig } from 'xlucene-evaluator';
import { DataAccessConfig } from './acl-manager';

/**
 * Using a DataAccess ACL, limit queries to
 * specific fields and records
*/
export class QueryAccess {
    config: DataAccessConfig;
    private _queryAccess: LuceneQueryAccess;
    private _typeConfig: TypeConfig|undefined;

    constructor(config: DataAccessConfig, types?: TypeConfig) {
        this.config = config;
        this._typeConfig = types;

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
    restrictESQuery(query: string, params: SearchParams = {}): SearchParams {
        if (params._source) {
            throw new TSError('Cannot include _source in params, use _sourceInclude or _sourceExclude');
        }

        const restricted = this._queryAccess.restrict(query);

        const body = Translator.toElasticsearchDSL(restricted, this._typeConfig);

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
        const fields = uniq(parseList(override));

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

export type SearchParamsDefaults = Partial<Omit<SearchParams, 'body'|'_sourceExclude'|'_sourceInclude'|'_source'>>;
