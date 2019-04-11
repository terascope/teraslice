import _ from 'lodash';
import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import { TermLikeAST, isWildcard, CachedParser } from '../parser';
import { CachedTranslator } from '../translator';
import { QueryAccessConfig } from './interfaces';
import { TypeConfig } from '../interfaces';

export class QueryAccess<T extends ts.AnyObject = ts.AnyObject> {
    readonly excludes: (keyof T)[];
    readonly includes: (keyof T)[];
    readonly constraint?: string;
    readonly preventPrefixWildcard: boolean;
    readonly allowImplicitQueries: boolean;
    readonly convertEmptyQueryToWildcard: boolean;
    readonly typeConfig: TypeConfig;
    private readonly _parser: CachedParser = new CachedParser();
    private readonly _translator: CachedTranslator = new CachedTranslator();

    constructor(config: QueryAccessConfig<T> = {}) {
        const {
            excludes = [],
            includes = [],
            constraint,
            prevent_prefix_wildcard,
            allow_implicit_queries,
            convert_empty_query_to_wildcard,
            type_config = {}
        } = config;

        this.excludes = excludes;
        this.includes = includes;
        this.constraint = constraint;
        this.preventPrefixWildcard = !!prevent_prefix_wildcard;
        this.allowImplicitQueries = !!allow_implicit_queries;
        this.convertEmptyQueryToWildcard = !!convert_empty_query_to_wildcard;
        this.typeConfig = type_config;
    }

    clearCache() {
        this._parser.reset();
        this._translator.reset();
    }

    /**
     * Validate and restrict a xlucene query
     *
     * @returns a restricted xlucene query
    */
    restrict(query: string): string {
        if (this.includes.length && !query.length && !this.convertEmptyQueryToWildcard) {
            throw new ts.TSError('Empty queries are restricted', {
                statusCode: 403
            });
        }

        const parser = this._parser.parse(query);
        parser.forTermTypes((node: TermLikeAST) => {
            // restrict when a term is specified without a field
            if (!node.field) {
                if (this.allowImplicitQueries) return;

                throw new ts.TSError('Implicit fields are restricted, please specify the field', {
                    statusCode: 403
                });
            }

            if (this._isFieldExcluded(node.field)) {
                throw new ts.TSError(`Field ${node.field} in query is restricted`, {
                    statusCode: 403
                });
            }

            if (this._isFieldIncluded(node.field)) {
                throw new ts.TSError(`Field ${node.field} in query is restricted`,  {
                    statusCode: 403
                });
            }

            if (isWildcard(node)) {
                if (this.preventPrefixWildcard && startsWithWildcard(node.value)) {
                    throw new ts.TSError('Wildcard queries of the form \'fieldname:*value\' or \'fieldname:?value\' in query are restricted',  {
                        statusCode: 403
                    });
                }
            }
        });

        if (!query && this.convertEmptyQueryToWildcard) {
            if (this.constraint) {
                return this.constraint;
            }

            return '*';
        }

        if (this.constraint) {
            return `${query} AND ${this.constraint}`;
        }

        return query;
    }

    /**
     * Converts a restricted xlucene query to an elasticsearch search query
     *
     * @returns a restricted elasticsearch search query
    */
    restrictSearchQuery(query: string, params: Partial<es.SearchParams> = {}): es.SearchParams {
        if (params._source) {
            throw new ts.TSError('Cannot include _source in params, use _sourceInclude or _sourceExclude');
        }

        const restricted = this.restrict(query);
        const parsed = this._parser.parse(restricted);
        const translated = this._translator.toElasticsearchDSL(parsed, this.typeConfig);

        const {
            includes,
            excludes
        } = this.restrictSourceFields(params._sourceInclude as (keyof T)[], params._sourceExclude as (keyof T)[]);

        const searchParams = _.defaultsDeep({}, params, {
            body: translated,
            _sourceInclude: includes,
            _sourceExclude: excludes
        });

        if (searchParams.q) {
            delete searchParams.q;
        }

        return searchParams;
    }

    /**
     * Restrict requested source to all or subset of the ones available
     *
     * **NOTE:** this will remove restricted fields and will not throw
    */
    restrictSourceFields(includes?: (keyof T)[], excludes?: (keyof T)[]) {
        return {
            includes: this._getSourceFields(this.includes, includes),
            excludes: this._getSourceFields(this.excludes, excludes),
        };
    }

    private _getSourceFields(restricted?: (keyof T)[], override?: (keyof T)[]|boolean|(keyof T)): (keyof T)[]|undefined {
        if (restricted && override) {
            const fields = ts.uniq(ts.parseList(override) as (keyof T)[]);

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

    private _isFieldExcluded(field: string): boolean {
        if (!this.excludes.length) return false;
        return this.excludes.some((str) => ts.startsWith(field, str as string));
    }

    private _isFieldIncluded(field: string): boolean {
        if (!this.includes.length) return false;
        return !this.includes.some((str) => ts.startsWith(field, str as string));
    }
}

function startsWithWildcard(input?: string|number) {
    if (!input) return false;
    if (!ts.isString(input)) return false;

    return ['*', '?'].includes(ts.getFirstChar(input));
}
