import {
    castArray, get, getFirstKey, getFirstValue,
    isTest, getTime
} from '@terascope/core-utils';
import { getErrorType } from './errors.js';
import {
    Shard, TimeSeriesFormat, BulkResponse,
    BulkResponseItem, BulkAction
} from '../interfaces.js';

export function getTimeByField(field = ''): (input: any) => number {
    return (input) => getTime(get(input, field)) || Date.now();
}

export function shardsPath(index: string): (stats: any) => Shard[] {
    return (stats) => get(stats, [index, 'shards'], []);
}

export function verifyIndexShards(shards: Shard[]): boolean {
    return castArray(shards)
        .filter((shard) => shard.primary)
        .every((shard) => shard.stage === 'DONE');
}

export const __timeSeriesTest: { date?: Date } = {};

const formatter: Record<TimeSeriesFormat, number> = {
    daily: 10,
    monthly: 7,
    yearly: 4,
};
export function timeSeriesIndex(index: string, timeSeriesFormat: TimeSeriesFormat = 'monthly'): string {
    const format = formatter[timeSeriesFormat];
    if (!format) throw new Error(`Unsupported format "${timeSeriesFormat}"`);

    let dateStr: string;
    if (isTest && __timeSeriesTest.date) {
        dateStr = __timeSeriesTest.date.toISOString();
    } else {
        dateStr = new Date().toISOString();
    }

    // remove -* or * at the end of the index name
    const indexName = index.replace(/-{0,1}\*$/, '');
    return `${indexName}-${dateStr.slice(0, format).replace(/-/g, '.')}`;
}

export function filterBulkRetries<T>(records: T[], result: BulkResponse): T[] {
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

            if (type === 'es_rejected_execution_exception' || type === 'rejected_execution_exception') {
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
    item: BulkResponseItem;
    action: BulkAction;
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
        item: getFirstValue(input) as BulkResponseItem,
        action: getFirstKey(input) as BulkAction,
    };
}
