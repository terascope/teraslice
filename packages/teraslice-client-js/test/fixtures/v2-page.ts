import type { TerasliceApiV2 } from '@terascope/types';

/**
 * A /v2 list response holding `data`, by default as one complete page.
 * `pagination` overrides its pagination, e.g. a `from` and `has_more`.
 */
export function v2Page<T>(
    data: T[],
    pagination: Partial<TerasliceApiV2.Pagination> = {}
): TerasliceApiV2.Page<T> {
    return {
        data,
        pagination: {
            total: data.length,
            from: 0,
            size: 100,
            has_more: false,
            ...pagination,
        },
    };
}
