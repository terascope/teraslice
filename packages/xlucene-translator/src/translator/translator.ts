import { debugLogger, isString } from '@terascope/core-utils';
import { parseGeoDistanceUnit } from '@terascope/geo-utils';
import {
    xLuceneVariables, xLuceneTypeConfig, GeoDistanceUnit,
    ElasticsearchDSLOptions, ElasticsearchDSLResult,
    ElasticsearchDistribution, SQLResult, xLuceneSQLOptions
} from '@terascope/types';
import { Parser } from 'xlucene-parser';
import { TranslatorOptions } from './interfaces.js';
import { translateQuery } from './utils.js';
import { getSQLDialect, translateSQLQuery } from './sql/index.js';

const logger = debugLogger('xlucene-translator');

export class Translator {
    readonly query: string;
    readonly typeConfig: xLuceneTypeConfig;
    readonly variables: xLuceneVariables | undefined;
    private readonly _parser: Parser;
    private _defaultGeoField?: string;
    private _defaultGeoSortOrder: 'asc' | 'desc' = 'asc';
    private _defaultGeoSortUnit: GeoDistanceUnit = 'meters';

    constructor(input: string | Parser, options: TranslatorOptions = {}) {
        this.variables = options.variables;

        this.typeConfig = options.type_config || {};
        if (isString(input)) {
            this._parser = new Parser(input, {
                type_config: this.typeConfig,
                variables: options.variables,
                filterNilVariables: options.filterNilVariables
            });
        } else {
            this._parser = input;
        }

        if (options.default_geo_field) {
            this._defaultGeoField = options.default_geo_field;
        }
        if (options.default_geo_sort_order) {
            this._defaultGeoSortOrder = options.default_geo_sort_order;
        }
        if (options.default_geo_sort_unit) {
            this._defaultGeoSortUnit = parseGeoDistanceUnit(options.default_geo_sort_unit);
        }

        this.query = this._parser.query;
    }

    toElasticsearchDSL(opts: ElasticsearchDSLOptions = {}): ElasticsearchDSLResult {
        const result = translateQuery(this._parser, {
            logger,
            majorVersion: opts.majorVersion ?? 2,
            minorVersion: opts.minorVersion ?? 15,
            version: opts.version ?? '2.15.0',
            distribution: opts.distribution ?? ElasticsearchDistribution.opensearch,
            type_config: this.typeConfig,
            default_geo_field: this._defaultGeoField,
            variables: this.variables ?? {},
            geo_sort_point: opts.geo_sort_point,
            geo_sort_order: opts.geo_sort_order || this._defaultGeoSortOrder,
            geo_sort_unit: opts.geo_sort_unit || this._defaultGeoSortUnit,
        });

        if (logger.level() === 10) {
            const resultStr = JSON.stringify(result, null, 2);
            logger.trace(`translated ${this.query ? this.query : '\'\''} query to`, resultStr);
        }

        return result;
    }

    /**
     * Translate the query to a SQL boolean expression.
     *
     * The result is an EXPRESSION and not a statement - `"bar" = 'hello'`, not
     * `SELECT ... WHERE ...` - because the caller owns the projection and the source. Hand it
     * to a `WHERE` clause, or to any API that takes a predicate.
     *
     * **The dialect is not cosmetic.** Engines differ on regular expressions, IP containment
     * and every geo predicate, so `opts.dialect` decides which SQL is emitted; it defaults to
     * DuckDB, which is the engine this is verified against.
     *
     * @example
     * new Translator('bar:hello AND num:>50', { type_config }).toSQL();
     * // { query: '(("bar" = \'hello\') AND ("num" > 50))' }
    */
    toSQL(opts: xLuceneSQLOptions = {}): SQLResult {
        const result = translateSQLQuery(this._parser, {
            logger,
            dialect: getSQLDialect(opts.dialect),
            type_config: this.typeConfig,
            default_geo_field: this._defaultGeoField,
            variables: this.variables ?? {},
            geo_sort_point: opts.geo_sort_point,
            geo_sort_order: opts.geo_sort_order || this._defaultGeoSortOrder,
            geo_sort_unit: opts.geo_sort_unit || this._defaultGeoSortUnit,
        });

        if (logger.level() === 10) {
            logger.trace(`translated ${this.query ? this.query : '\'\''} query to sql`, result);
        }

        return result;
    }
}
