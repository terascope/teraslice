import _ from 'lodash';
import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import * as p from '../parser';
import { CachedTranslator, SortOrder } from '../translator';
import * as i from './interfaces';
import { GeoDistanceUnit, TypeConfig, FieldType } from '../interfaces';
import { parseWildCard, matchString } from '../document-matcher/logic-builder/string';

const _logger = ts.debugLogger('xlucene-query-access');

export class QueryAccess<T extends ts.AnyObject = ts.AnyObject> {
    readonly excludes: (keyof T)[];
    readonly includes: (keyof T)[];
    readonly constraints?: string[];
    readonly preventPrefixWildcard: boolean;
    readonly allowImplicitQueries: boolean;
    readonly defaultGeoField?: string;
    readonly defaultGeoSortOrder?: SortOrder;
    readonly defaultGeoSortUnit?: GeoDistanceUnit|string;
    readonly allowEmpty: boolean;
    readonly typeConfig: TypeConfig;
    readonly parsedTypeConfig: TypeConfig;
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

        const typeConfig = config.type_config || options.type_config || {};
        if (ts.isEmpty(typeConfig)) throw new Error('type_config must be provided');
        this.typeConfig = { ...typeConfig };

        this.logger = options.logger != null
            ? options.logger.child({ module: 'xlucene-query-access' })
            : _logger;

        this.excludes = excludes;
        this.includes = includes;
        this.constraints = ts.castArray(constraint).filter(Boolean) as string[];
        this.allowEmpty = Boolean(allowEmpty);
        this.preventPrefixWildcard = Boolean(config.prevent_prefix_wildcard);
        this.allowImplicitQueries = Boolean(config.allow_implicit_queries);
        this.defaultGeoField = config.default_geo_field;
        this.defaultGeoSortOrder = config.default_geo_sort_order;
        this.defaultGeoSortUnit = config.default_geo_sort_unit;
        this.parsedTypeConfig = this._restrictTypeConfig();
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
            return addConstraints(this.constraints, '');
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

            if (this._isFieldRestricted(node.field)) {
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

        return addConstraints(this.constraints, q);
    }

    private _restrictTypeConfig(): TypeConfig {
        const parsedConfig: TypeConfig = {};

        for (const [typeField, value] of Object.entries(this.typeConfig)) {
            const excluded = this.excludes.filter((restrictField) => matchTypeField(
                typeField,
                restrictField as string
            ));
            if (excluded.length) continue;

            if (this.includes.length) {
                const included = this.includes.filter((restrictField) => matchTypeField(
                    typeField,
                    restrictField as string
                ));
                if (!included.length) continue;
            }

            parsedConfig[typeField] = value;
        }

        return parsedConfig;
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
            type_config: this.parsedTypeConfig,
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

    private _isFieldRestricted(field: string): boolean {
        return !Object.entries(this.parsedTypeConfig).some(([typeField, fieldType]) => {
            if (fieldType === FieldType.Object) return false;
            const parts = typeField.split('.');

            if (parts.length > 1) {
                const firstPart = parts.slice(0, -1).join('.');
                if (this.typeConfig[firstPart] === FieldType.Object) {
                    return matchFieldObject(typeField, field);
                }
            }
            return matchField(typeField, field);
        });
    }
}

function matchFieldObject(typeField: string, field: string) {
    const wildcardQuery = parseWildCard(field).replace(/\$$/, '');
    let s = '';
    for (const part of typeField.split('.')) {
        s += part;
        if (matchString(s, wildcardQuery)) {
            return true;
        }

        s += '.';
    }
    return false;
}

function matchField(typeField: string, field: string) {
    let s = '';
    for (const part of field.split('.')) {
        s += part;
        const wildcardQuery = parseWildCard(s);
        if (matchString(typeField, wildcardQuery)) {
            return true;
        }

        s += '.';
    }

    return false;
}

function matchTypeField(typeField: string, restrictField: string) {
    let s = '';
    for (const part of typeField.split('.')) {
        s += part;

        if (s === restrictField) {
            return true;
        }

        s += '.';
    }
    return false;
}

function startsWithWildcard(input?: string | number) {
    if (!input) return false;
    if (!ts.isString(input)) return false;

    return ['*', '?'].includes(ts.getFirstChar(input));
}

function addConstraints(constraints?: string[], query?: string): string {
    const queries = ts.concat(constraints || [], [query]).filter(Boolean) as string[];
    if (queries.length === 0) return '';
    if (queries.length === 1) return queries[0];
    return `(${queries.join(') AND (')})`;
}
