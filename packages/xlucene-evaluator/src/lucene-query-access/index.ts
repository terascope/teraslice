import _ from 'lodash';
import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import LuceneQueryParser from '../lucene-query-parser';
import Translator from '../translator';
import { AST, IMPLICIT, TypeConfig } from '../interfaces';

export interface QueryAccessConfig<T extends AnyData = AnyData> {
    excludes?: (keyof T)[];
    includes?: (keyof T)[];
    constraint?: string;
    prevent_prefix_wildcard?: boolean;
    allow_implicit_queries?: boolean;
    type_config?: TypeConfig;
}

export default class LuceneQueryAccess<T extends AnyData = AnyData> {
    excludes: (keyof T)[];
    includes: (keyof T)[];
    constraint?: string;
    preventPrefixWildcard: boolean;
    allowImplicitQueries: boolean;
    typeConfig: TypeConfig;

    constructor(config: QueryAccessConfig<T> = {}) {
        const {
            excludes = [],
            includes = [],
            constraint,
            prevent_prefix_wildcard,
            allow_implicit_queries,
            type_config = {}
        } = config;

        this.excludes = excludes;
        this.includes = includes;
        this.constraint = constraint;
        this.preventPrefixWildcard = !!prevent_prefix_wildcard;
        this.allowImplicitQueries = !!allow_implicit_queries;
        this.typeConfig = type_config;
    }

    /**
     * Validate and restrict a xlucene query
     *
     * @returns a restricted xlucene query
    */
    restrict(query: string): string {
        if (this.includes.length && !query.length) {
            throw new ts.TSError('Empty queries are restricted', {
                statusCode: 403
            });
        }

        const parser = new LuceneQueryParser();
        parser.parse(query);
        parser.walkLuceneAst((node: AST, field: string) => {
            // restrict when a term is specified without a field
            if (node.field && !field) {
                if (this.allowImplicitQueries) return;

                throw new ts.TSError('Implicit queries are restricted', {
                    statusCode: 403
                });
            }

            if (!node.field || node.field === IMPLICIT) return;

            if (this._isFieldExcluded(node.field)) {
                throw new ts.TSError(`Field ${node.field} is restricted`, {
                    statusCode: 403
                });
            }

            if (this._isFieldIncluded(node.field)) {
                throw new ts.TSError(`Field ${node.field} is restricted`,  {
                    statusCode: 403
                });
            }

            if (this.preventPrefixWildcard && startsWithWildcard(node.term)) {
                throw new ts.TSError('Prefix wildcards are restricted',  {
                    statusCode: 403
                });
            }
        });

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
        const body = Translator.toElasticsearchDSL(restricted, this.typeConfig);
        const {
            includes,
            excludes
        } = this.restrictSourceFields(params._sourceInclude as (keyof T)[], params._sourceExclude as (keyof T)[]);

        const searchParams = _.defaultsDeep({}, params, {
            body,
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

export interface AnyData {
    [prop: string]: any;
}

function startsWithWildcard(input?: string|number) {
    if (!input) return false;
    if (!ts.isString(input)) return false;

    return ['*', '?'].includes(input.trim().charAt(0));
}
