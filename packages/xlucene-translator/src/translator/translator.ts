import { debugLogger, isString } from '@terascope/core-utils';
import { parseGeoDistanceUnit } from '@terascope/geo-utils';
import {
    xLuceneVariables, xLuceneTypeConfig,
    ElasticsearchDSLOptions, ElasticsearchDSLResult,
    ElasticsearchDistribution, XluceneGeoSortConfig
} from '@terascope/types';
import { Parser } from 'xlucene-parser';
import type { TranslatorOptions } from './interfaces.js';
import { translateQuery } from './utils.js';

const logger = debugLogger('xlucene-translator');

export class Translator {
    readonly query: string;
    readonly typeConfig: xLuceneTypeConfig;
    readonly variables: xLuceneVariables | undefined;
    private readonly _parser: Parser;
    private _defaultGeoSortConfig: XluceneGeoSortConfig;

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

        this._defaultGeoSortConfig = {
            field: options.default_geo_field,
            default_order: options.default_geo_sort_order || 'asc',
            default_unit: options.default_geo_sort_unit
                ? parseGeoDistanceUnit(options.default_geo_sort_unit)
                : 'meters'
        };

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
            variables: this.variables ?? {},
            geo_sort_config: {
                ...this._defaultGeoSortConfig,
                point: opts.geo_sort_point,
                order: opts.geo_sort_order,
                unit: opts.geo_sort_unit
            },
        });

        if (logger.level() === 10) {
            const resultStr = JSON.stringify(result, null, 2);
            logger.trace(`translated ${this.query ? this.query : '\'\''} query to`, resultStr);
        }

        return result;
    }
}
