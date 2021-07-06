import { Client } from 'elasticsearch';
import * as ts from '@terascope/utils';
import type { ESFieldType, ESTypeMapping } from '@terascope/types';
import { getErrorType } from './errors';
import * as i from '../interfaces';

export function getTimeByField(field = ''): (input: any) => number {
    return (input) => ts.getTime(ts.get(input, field)) || Date.now();
}

export function shardsPath(index: string): (stats: any) => i.Shard[] {
    return (stats) => ts.get(stats, [index, 'shards'], []);
}

export function verifyIndexShards(shards: i.Shard[]): boolean {
    return ts.castArray(shards)
        .filter((shard) => shard.primary)
        .every((shard) => shard.stage === 'DONE');
}

export const __timeSeriesTest: { date?: Date } = {};

const formatter: Record<i.TimeSeriesFormat, number> = {
    daily: 10,
    monthly: 7,
    yearly: 4,
};
export function timeSeriesIndex(index: string, timeSeriesFormat: i.TimeSeriesFormat = 'monthly'): string {
    const format = formatter[timeSeriesFormat];
    if (!format) throw new Error(`Unsupported format "${timeSeriesFormat}"`);

    let dateStr: string;
    if (ts.isTest && __timeSeriesTest.date) {
        dateStr = __timeSeriesTest.date.toISOString();
    } else {
        dateStr = new Date().toISOString();
    }

    // remove -* or * at the end of the index name
    const indexName = index.replace(/-{0,1}\*$/, '');
    return `${indexName}-${dateStr.slice(0, format).replace(/-/g, '.')}`;
}

export function filterBulkRetries<T>(records: T[], result: i.BulkResponse): T[] {
    if (!result.errors) return [];

    const retry = [];
    const { items } = result;

    const errorTypes = ['document_already_exists_exception', 'document_missing_exception'];

    for (let index = 0; index < items.length; index += 1) {
        // key could either be create or delete etc, just want the actual data at the value spot
        const { item } = getBulkResponseItem(items[index]);

        // On a create request if a document exists it's not an error.
        // are there cases where this is incorrect?
        if (item.error && item.status !== 409) {
            const type = getErrorType(item);

            if (type === 'es_rejected_execution_exception') {
                // retry this record
                if (records[index] != null) {
                    retry.push(records[index]);
                }
            } else if (errorTypes.includes(type)) {
                const error = new Error(`${type}--${item.error.reason}`);
                Error.captureStackTrace(error, filterBulkRetries);
                throw error;
            }
        }
    }

    return retry;
}

type BulkResponseItemResult = {
    item: i.BulkResponseItem;
    action: i.BulkAction;
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
export function getBulkResponseItem(input: any = {}): BulkResponseItemResult {
    return {
        item: ts.getFirstValue(input) as i.BulkResponseItem,
        action: ts.getFirstKey(input) as i.BulkAction,
    };
}

export function getESVersion(client: Client): number {
    const version = ts.get(client, 'transport._config.apiVersion', '6.5');
    if (version && ts.isString(version)) {
        const [majorVersion] = version.split('.');
        return ts.toNumber(majorVersion);
    }
    return 6;
}

export function fixMappingRequest(
    client: Client, _params: Record<string, any>, isTemplate: boolean
): any {
    if (!_params || !_params.body) {
        throw new Error('Invalid mapping request');
    }
    const params = ts.cloneDeep(_params);
    const defaultParams: any = {};

    const esVersion = getESVersion(client);

    if (esVersion === 5) {
        if (params.body.index_patterns != null) {
            if (isTemplate && params.body.template == null) {
                params.body.template = ts.getFirst(params.body.index_patterns);
            }
            delete params.body.index_patterns;
        }
    }

    if (esVersion >= 6) {
        if (params.body.template != null) {
            if (isTemplate && params.body.index_patterns == null) {
                params.body.index_patterns = ts.castArray(params.body.template).slice();
            }
            delete params.body.template;
        }
    }

    if (esVersion >= 7) {
        const typeMapping = ts.get(params.body, 'mappings', {});
        defaultParams.includeTypeName = false;
        if (typeMapping) {
            delete typeMapping._all;
        }
    }

    return Object.assign({}, defaultParams, params);
}

/**
 * This is the return type for {@link getFlattenedNamesAndTypes}
*/
export type FlattenProperties = Record<string, [type: ESFieldType, extra?: string]>;

/**
 * This is useful for diffing the property mappings, the keys should be
 * sorted so this can be stringified and diffed.
*/
export function getFlattenedNamesAndTypes(config: ESTypeMapping): FlattenProperties {
    const output: FlattenProperties = Object.create(null);
    for (const field of Object.keys(config).sort()) {
        const { type: _type, properties, ...extra } = config[field];

        // if there is no type, elasticsearch returns "undefined" for the type
        // but this will cause conflicts, we should set it to "object"
        const type: ESFieldType = _type == null ? 'object' : _type;

        const extraSorted = ts.sortKeys(extra, { deep: true });

        output[field] = ts.isEmpty(extraSorted) ? [type] : [
            type,
            JSON.stringify(extraSorted)
        ];

        // this means the object is nested
        if (properties) {
            const nestedOutput = getFlattenedNamesAndTypes(properties);
            for (const [nestedField, nestedConfig] of Object.entries(nestedOutput)) {
                output[`${field}.${nestedField}`] = nestedConfig;
            }
        }
    }
    return output;
}
