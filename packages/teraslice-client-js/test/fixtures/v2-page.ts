import type { TerasliceApiV2 } from '@terascope/types';

/** A /v2 list response holding `data` as one complete page */
export function v2Page<T>(data: T[]): TerasliceApiV2.Page<T> {
    return {
        data,
        pagination: {
            total: data.length,
            total_relation: 'eq',
            from: 0,
            size: 100,
            has_more: false,
        },
    };
}
