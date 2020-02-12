import {
    debugLogger, isString, Logger, parseGeoDistanceUnit
} from '@terascope/utils';
import {
    XluceneVariables,
    XluceneTypeConfig,
    GeoDistanceUnit,
    ElasticsearchDSLOptions,
    ElasticsearchDSLResult
} from '@terascope/types';
import { Parser } from 'xlucene-parser';
import * as i from './interfaces';
import * as utils from './utils';

const _logger = debugLogger('xlucene-translator');

export class Translator {
    readonly query: string;
    logger: Logger;
    readonly typeConfig: XluceneTypeConfig;
    readonly variables: XluceneVariables | undefined;
    private readonly _parser: Parser;
    private _defaultGeoField?: string;
    private _defaultGeoSortOrder: 'asc'|'desc' = 'asc';
    private _defaultGeoSortUnit: GeoDistanceUnit = 'meters';

    constructor(input: string | Parser, options: i.TranslatorOptions = {}) {
        this.variables = options.variables;
        this.logger = options.logger != null
            ? options.logger.child({ module: 'xlucene-translator' })
            : _logger;

        this.typeConfig = options.type_config || {};
        if (isString(input)) {
            this._parser = new Parser(input, {
                type_config: this.typeConfig,
                logger: this.logger,
                variables: this.variables
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
        const result = utils.translateQuery(this._parser, {
            logger: this.logger,
            type_config: this.typeConfig,
            default_geo_field: this._defaultGeoField,
            geo_sort_point: opts.geo_sort_point,
            geo_sort_order: opts.geo_sort_order || this._defaultGeoSortOrder,
            geo_sort_unit: opts.geo_sort_unit || this._defaultGeoSortUnit,
        });

        if (this.logger.level() === 10) {
            const resultStr = JSON.stringify(result, null, 2);
            this.logger.trace(`translated ${this.query ? this.query : "''"} query to`, resultStr);
        }

        return result;
    }
}
