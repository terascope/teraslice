import * as R from 'rambda';
import { TSError } from '@terascope/utils';
import * as i from '../interfaces';
import {
    getErrorType
} from './errors';
import {
    getFirstKey,
    getFirstValue
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

export function getBulkResponseItem(input: any = {}): BulkResponseItemResult  {
    return {
        item: getFirstValue(input),
        action: getFirstKey(input),
    };
}
