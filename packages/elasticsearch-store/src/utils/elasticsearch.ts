import * as R from 'rambda';
import { TypeConfig, Translator, TypeMapping } from 'xlucene-evaluator';
import { TSError, isPlainObject, isEmpty } from '@terascope/utils';
import * as i from '../interfaces';
import {
    getErrorType
} from './errors';
import {
    getFirstKey,
    getFirstValue,
    buildNestPath
} from './misc';

export function getTimeByField(field: string = ''): (input: any) => number {
    return R.ifElse(
        R.has(field),
        R.pipe(R.path(field), (input: any) => new Date(input).getTime()),
        () => Date.now()
    );
}

export function shardsPath(index: string): (stats: any) => i.Shard[] {
    return R.pathOr([], [index, 'shards']);
}

export const verifyIndexShards: (shards: i.Shard[]) => boolean = R.pipe(
    // @ts-ignore
    R.filter((shard: i.Shard) => shard.primary),
    R.all((shard: i.Shard) => shard.stage === 'DONE')
);

export function timeseriesIndex(index: string, timeSeriesFormat: i.TimeSeriesFormat = 'monthly'): string {
    const formatter = {
        daily: 10,
        monthly: 7,
        yearly: 4
    };

    const format = formatter[timeSeriesFormat];
    if (!format) throw new Error(`Unsupported format "${timeSeriesFormat}"`);

    const dateStr = new Date().toISOString();
    // remove -* or * at the end of the index name
    const indexName = index.replace(/\-{0,1}\*$/, '');
    return `${indexName}-${dateStr.slice(0, format).replace(/-/g, '.')}`;
}

export function filterBulkRetries<T>(records: T[], result: i.BulkResponse): T[] {
    if (!result.errors) return [];

    const retry = [];
    const { items } = result;

    const errorTypes = [
        'document_already_exists_exception',
        'document_missing_exception'
    ];

    for (let i = 0; i < items.length; i += 1) {
        // key could either be create or delete etc, just want the actual data at the value spot
        const { item } = getBulkResponseItem(items[i]);

        // On a create request if a document exists it's not an error.
        // are there cases where this is incorrect?
        if (item.error && item.status !== 409) {
            const type = getErrorType(item);

            if (type === 'es_rejected_execution_exception') {
                // retry this record
                if (records[i] != null) {
                    retry.push(records[i]);
                }
            } else if (errorTypes.includes(type)) {
                const error = new TSError(`${type}--${item.error.reason}`);
                Error.captureStackTrace(error, filterBulkRetries);
                throw error;
            }
        }
    }

    return retry;
}

type BulkResponseItemResult = {
    item: i.BulkResponseItem,
    action: i.BulkAction
};

/**
 * Get the first key and value from the bulk response:
 *
 * Here is an example input:
 *
 * ```json
  {
     "index": {
        "_index": "test",
        "_type": "type1",
        "_id": "1",
        "_version": 1,
        "result": "created",
        "_shards": {
            "total": 2,
            "successful": 1,
            "failed": 0
        },
        "created": true,
        "status": 201
     }
  }
 * ```
 */
export function getBulkResponseItem(input: any = {}): BulkResponseItemResult  {
    return {
        item: getFirstValue(input),
        action: getFirstKey(input),
    };
}

export function getXLuceneTypesFromMapping(mapping: any): TypeConfig|undefined {
    if (!isPlainObject(mapping) || isEmpty(mapping)) return;

    const result: TypeConfig = {};

    if (mapping.properties != null) {
        const entries = getTypesFromProperties(mapping.properties);
        for (const [key, val] of entries) {
            result[key] = val;
        }
    }

    return result;
}

type TypeMappingPair = [string, (keyof TypeMapping)];
type MappingProperties = { [key: string]: MappingProperty };
type MappingProperty = { type? : string, properties: MappingProperties };

export function getTypesFromProperties(properties: MappingProperties, basePath = ''): TypeMappingPair[] {
    const result: TypeMappingPair[] = [];
    for (const [key, value] of Object.entries(properties)) {
        if (isPlainObject(value) && key) {
            const path = buildNestPath([basePath, key]);

            if (value.properties) {
                result.push(...getTypesFromProperties(value.properties, path));
            } else {
                const type = getXluceneTypeFromESType(value.type);
                if (type) {
                    result.push([path, type]);
                }
            }
        }
    }
    return result;
}

export function getXluceneTypeFromESType(type?: string): (keyof TypeMapping)|undefined {
    if (!type) return;

    if (['geo_point', 'geo_shape'].includes(type)) return 'geo';
    if (type === 'ip') return 'ip';
    if (type === 'date') return 'date';

    return;
}

export function translateQuery(query: string, types?: TypeConfig): { q: null, body: TranslatedDSL } {
    return {
        q: null,
        body: Translator.toElasticsearchDSL(query, types)
    };
}

export type TranslatedDSL = ReturnType<Translator['toElasticsearchDSL']>;
