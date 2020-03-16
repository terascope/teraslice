import * as es from 'elasticsearch';
import * as ts from '@terascope/utils';
import * as p from 'xlucene-parser';
import {
    SortOrder,
    GeoDistanceUnit,
    xLuceneVariables,
    xLuceneTypeConfig,
    xLuceneFieldType
} from '@terascope/types';
import { CachedTranslator } from '../translator';
import * as i from './interfaces';

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
    readonly typeConfig: xLuceneTypeConfig;
    readonly parsedTypeConfig: xLuceneTypeConfig;
    readonly variables: xLuceneVariables;
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
        const variables = options.variables || {};

        if (ts.isEmpty(typeConfig)) throw new Error('Configuration for type_config must be provided');
        this.typeConfig = { ...typeConfig };

        this.logger = options.logger || _logger;

        this.excludes = excludes?.slice();
        this.includes = includes?.slice();
        this.constraints = ts.castArray(constraint).filter(Boolean) as string[];
        this.allowEmpty = Boolean(allowEmpty);
        this.preventPrefixWildcard = Boolean(config.prevent_prefix_wildcard);
        this.allowImplicitQueries = Boolean(config.allow_implicit_queries);
        this.defaultGeoField = config.default_geo_field;
        this.defaultGeoSortOrder = config.default_geo_sort_order;
        this.defaultGeoSortUnit = config.default_geo_sort_unit;
        this.parsedTypeConfig = this._restrictTypeConfig();
        this.variables = variables;
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
    restrict(q: string, options: i.RestrictOptions = {}): string {
        return this._restrict(q, options).query;
    }

    /**
     * Validate and restrict a xlucene query
     *
     * @returns a restricted xlucene query
     */
    private _restrict(q: string, options: i.RestrictOptions = {}): p.Parser {
        let parser: p.Parser;
        const parserOptions: p.ParserOptions = {
            logger: this.logger,
            type_config: this.typeConfig,
            variables: Object.assign({}, this.variables, options.variables)
        };

        try {
            parser = this._parser.make(q, parserOptions);
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
            return this._addConstraints(parser, parserOptions);
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

        return this._addConstraints(parser, parserOptions);
    }

    private _restrictTypeConfig(): xLuceneTypeConfig {
        const parsedConfig: xLuceneTypeConfig = {};

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
    async restrictSearchQuery(
        query: string,
        opts: i.RestrictSearchQueryOptions = {}
    ): Promise<es.SearchParams> {
        const {
            params: _params = {},
            variables = {},
            elasticsearch_version: esVersion = 6,
            ...translateOptions
        } = opts;

        if (_params._source) {
            throw new ts.TSError('Cannot include _source in params, use _sourceInclude or _sourceExclude');
        }
        const params = { ..._params };

        const parser = this._restrict(query, { variables });

        await ts.pImmediate();

        const translator = this._translator.make(parser, {
            type_config: this.parsedTypeConfig,
            logger: this.logger,
            default_geo_field: this.defaultGeoField,
            default_geo_sort_order: this.defaultGeoSortOrder,
            default_geo_sort_unit: this.defaultGeoSortUnit,
            variables: parser.variables
        });

        const translated = translator.toElasticsearchDSL(translateOptions);

        const { includes, excludes } = this.restrictSourceFields(
            params._sourceInclude as (keyof T)[],
            params._sourceExclude as (keyof T)[]
        );

        delete params._sourceInclude;
        delete params._sourceExclude;

        const excludesKey: any = esVersion >= 7 ? '_sourceExcludes' : '_sourceExclude';
        const includesKey: any = esVersion >= 7 ? '_sourceIncludes' : '_sourceInclude';

        const searchParams: es.SearchParams = {
            ...params,
            body: { ...params.body, ...translated },
            [excludesKey]: excludes,
            [includesKey]: includes,
        };

        if (searchParams != null) {
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
        const all = Object.keys(this.parsedTypeConfig)
            .map((field) => field.split('.')[0]) as (keyof T)[];

        return {
            includes: this._getSourceFields(this.includes, all, includes),
            excludes: this._getSourceFields(this.excludes, all, excludes),
        };
    }

    private _getSourceFields(
        restricted: (keyof T)[],
        all: (keyof T)[],
        override?: (keyof T)[] | boolean | (keyof T),
    ): (keyof T)[] | undefined {
        const fields = ts.uniq(ts.parseList(override) as (keyof T)[]);

        if (fields.length) {
            if (restricted.length) {
                return restricted.filter((field) => fields.includes(field));
            }

            if (all.length) {
                return fields.filter((field) => all.includes(field));
            }

            return fields;
        }

        return restricted.slice();
    }

    private _isFieldRestricted(field: string): boolean {
        return !Object.entries(this.parsedTypeConfig).some(([typeField, fieldType]) => {
            if (fieldType === xLuceneFieldType.Object) return false;
            const parts = typeField.split('.');

            if (parts.length > 1) {
                const firstPart = parts.slice(0, -1).join('.');
                if (this.typeConfig[firstPart] === xLuceneFieldType.Object) {
                    return matchFieldObject(typeField, field);
                }
            }
            return matchField(typeField, field);
        });
    }

    private _addConstraints(parser: p.Parser, options: p.ParserOptions): p.Parser {
        if (this.constraints?.length) {
            const queries = ts.concat(this.constraints, [parser.query]).filter(Boolean) as string[];
            if (queries.length === 1) return this._parser.make(queries[0], options);
            return this._parser.make(`(${queries.join(') AND (')})`, options);
        }
        return parser;
    }
}

function matchFieldObject(typeField: string, field: string) {
    let s = '';
    for (const part of typeField.split('.')) {
        s += part;

        if (ts.matchWildcard(field, s)) {
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

        if (ts.matchWildcard(s, typeField)) {
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
