import { Units } from '@turf/helpers';
import { debugLogger, isString, Logger } from '@terascope/utils';
import { TypeConfig, Parser } from '../parser';
import { parseGeoDistanceUnit } from '../utils';
import * as i from './interfaces';
import * as utils from './utils';

const _logger = debugLogger('xlucene-translator');

export class Translator {
    readonly query: string;
    logger: Logger;
    readonly typeConfig?: TypeConfig;
    private readonly _parser: Parser;
    private _defaultGeoSortOrder: 'asc'|'desc' = 'asc';
    private _defaultGeoSortUnit: Units = 'meters';

    constructor(input: string | Parser, options: i.TranslatorOptions = {}) {
        this.logger = options.logger != null ? options.logger.child({ module: 'xlucene-translator' }) : _logger;

        if (isString(input)) {
            this._parser = new Parser(input, options.type_config, options.logger);
        } else {
            this._parser = input;
        }
        if (options.default_geo_sort_order) {
            this._defaultGeoSortOrder = options.default_geo_sort_order;
        }
        if (options.default_geo_sort_unit) {
            this._defaultGeoSortUnit = parseGeoDistanceUnit(options.default_geo_sort_unit);
        }
        this.query = this._parser.query;
        this.typeConfig = options.type_config;
    }

    toElasticsearchDSL(): i.ElasticsearchDSLResult {
        const result = utils.translateQuery(this._parser, {
            logger: this.logger,
            default_geo_sort_order: this._defaultGeoSortOrder,
            default_geo_sort_unit: this._defaultGeoSortUnit,
        });

        const resultStr = JSON.stringify(result, null, 2);
        this.logger.trace(`translated ${this.query ? this.query : "''"} query to`, resultStr);

        return result;
    }
}
