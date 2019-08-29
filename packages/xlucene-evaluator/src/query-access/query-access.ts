import _ from 'lodash';
import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import * as p from '../parser';
import { CachedTranslator, SortOrder } from '../translator';
import * as i from './interfaces';

const _logger = ts.debugLogger('xlucene-query-access');

export class QueryAccess<T extends ts.AnyObject = ts.AnyObject> {
    readonly excludes: (keyof T)[];
    readonly includes: (keyof T)[];
    readonly constraint?: string;
    readonly preventPrefixWildcard: boolean;
    readonly allowImplicitQueries: boolean;
    readonly defaultGeoField?: string;
    readonly defaultGeoSortOrder?: SortOrder;
    readonly defaultGeoSortUnit?: p.GeoDistanceUnit|string;
    readonly allowEmpty: boolean;
    readonly typeConfig: p.TypeConfig;
    logger: ts.Logger;

    private readonly _parser: p.CachedParser = new p.CachedParser();
    private readonly _translator: CachedTranslator = new CachedTranslator();

    constructor(config: i.QueryAccessConfig<T> = {}, options: i.QueryAccessOptions = {}) {
        const {
            excludes = [],
            includes = [],
            constraint,
            allow_empty_queries: allowEmpty = true,
        } = config;

        this.logger = options.logger != null
            ? options.logger.child({ module: 'xlucene-query-access' })
            : _logger;

        this.excludes = excludes;
        this.includes = includes;
        this.constraint = constraint;
        this.allowEmpty = Boolean(allowEmpty);
        this.preventPrefixWildcard = Boolean(config.prevent_prefix_wildcard);
        this.allowImplicitQueries = Boolean(config.allow_implicit_queries);
        this.defaultGeoField = config.default_geo_field;
        this.defaultGeoSortOrder = config.default_geo_sort_order;
        this.defaultGeoSortUnit = config.default_geo_sort_unit;
        this.typeConfig = options.type_config || {};
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
    restrict(q: string): string {
        let parser: p.Parser;
        try {
            parser = this._parser.make(q, {
                logger: this.logger,
                type_config: this.typeConfig,
            });
        } catch (err) {
            throw new ts.TSError(err, {
                reason: 'Query could not be parsed',
                statusCode: 422,
                context: {
                    q,
                    safe: true
                }
            });
        }

        if (p.isEmptyAST(parser.ast)) {
            if (!this.allowEmpty) {
                throw new ts.TSError('Empty queries are restricted', {
                    statusCode: 403,
                    context: {
                        q,
                        safe: true
                    }
                });
            }
            return this.constraint || '';
        }

        parser.forTermTypes((node: p.TermLikeAST) => {
            // restrict when a term is specified without a field
            if (!node.field) {
                if (this.allowImplicitQueries) return;

                throw new ts.TSError('Implicit fields are restricted, please specify the field', {
                    statusCode: 403,
                    context: {
                        q,
                        safe: true
                    }
                });
            }

            if (this._isFieldExcluded(node.field)) {
                throw new ts.TSError(`Field ${node.field} in query is restricted`, {
                    statusCode: 403,
                    context: {
                        q,
                        safe: true
                    }
                });
            }

            if (this._isFieldIncluded(node.field)) {
                throw new ts.TSError(`Field ${node.field} in query is restricted`, {
                    statusCode: 403,
                    context: {
                        q,
                        safe: true
                    }
                });
            }

            if (p.isWildcard(node)) {
                if (this.preventPrefixWildcard && startsWithWildcard(node.value)) {
                    throw new ts.TSError("Wildcard queries of the form 'fieldname:*value' or 'fieldname:?value' in query are restricted", {
                        statusCode: 403,
                        context: {
                            q,
                            safe: true
                        }
                    });
                }
            }
        });

        if (this.constraint) {
            return `(${this.constraint}) AND (${q})`;
        }

        return q;
    }

    /**
     * Converts a restricted xlucene query to an elasticsearch search query
     *
     * @returns a restricted elasticsearch search query
     */
    restrictSearchQuery(query: string, opts: i.RestrictSearchQueryOptions = {}): es.SearchParams {
        const {
            params = {},
            elasticsearch_version: esVersion = 6,
            ...translateOptions
        } = opts;

        if (params._source) {
            throw new ts.TSError('Cannot include _source in params, use _sourceInclude or _sourceExclude');
        }

        const restricted = this.restrict(query);

        const parsed = this._parser.make(restricted, {
            type_config: this.typeConfig,
            logger: this.logger
        });

        const translator = this._translator.make(parsed, {
            type_config: this.typeConfig,
            logger: this.logger,
            default_geo_field: this.defaultGeoField,
            default_geo_sort_order: this.defaultGeoSortOrder,
            default_geo_sort_unit: this.defaultGeoSortUnit,
        });

        const translated = translator.toElasticsearchDSL(translateOptions);

        const { includes, excludes } = this.restrictSourceFields(
            params._sourceInclude as (keyof T)[],
            params._sourceExclude as (keyof T)[]
        );

        const searchParams = _.defaultsDeep({}, params, {
            body: translated,
            _sourceInclude: includes,
            _sourceExclude: excludes,
        });

        if (searchParams != null) {
            delete searchParams.q;
        }

        if (esVersion >= 7) {
            if (searchParams._sourceExclude) {
                searchParams._sourceExcludes = searchParams._sourceExclude.slice();
                delete searchParams._sourceExclude;
            }
            if (searchParams._sourceInclude) {
                searchParams._sourceIncludes = searchParams._sourceInclude.slice();
                delete searchParams._sourceInclude;
            }
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

    private _getSourceFields(
        restricted?: (keyof T)[],
        override?: (keyof T)[] | boolean | (keyof T)
    ): (keyof T)[] | undefined {
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

function startsWithWildcard(input?: string | number) {
    if (!input) return false;
    if (!ts.isString(input)) return false;

    return ['*', '?'].includes(ts.getFirstChar(input));
}
