import { TSError } from '@terascope/core-utils';

/*
 * Stand-ins for @opensearch-project/opensearch's error classes, which
 * teraslice doesn't depend on directly. core-utils recognizes OpenSearch
 * errors by the `OpenSearchClientError` class name in the prototype chain,
 * and the real ResponseError reads `statusCode` and `body` from `meta`.
 */
class OpenSearchClientError extends Error {}

class ResponseError extends OpenSearchClientError {
    constructor(message: string, readonly meta: { statusCode: number; body: unknown }) {
        super(message);
        this.name = 'ResponseError';
    }

    get statusCode() {
        return this.meta.statusCode;
    }

    get body() {
        return this.meta.body;
    }
}

/**
 * The error a search past `max_result_window` rejects with: the OpenSearch
 * client's ResponseError (body as returned by OpenSearch 2.15), wrapped in a
 * TSError by elasticsearch-api
 */
export function makeResultWindowError(limit = 10000, requested = 10001): TSError {
    const reason = `Result window is too large, from + size must be less than or equal to: [${limit}] but was [${requested}]. `
        + 'See the scroll api for a more efficient way to request large data sets. '
        + 'This limit can be set by changing the [index.max_result_window] index level setting.';
    const cause = { type: 'illegal_argument_exception', reason };
    const body = {
        error: {
            root_cause: [cause],
            type: 'search_phase_execution_exception',
            reason: 'all shards failed',
            phase: 'query',
            grouped: true,
            failed_shards: [{ shard: 0, index: 'some-index', node: 'node-1', reason: cause }],
            caused_by: { ...cause, caused_by: cause },
        },
        status: 400,
    };
    const responseError = new ResponseError(
        `search_phase_execution_exception: [illegal_argument_exception] Reason: ${reason}`,
        { statusCode: 400, body }
    );
    return new TSError(responseError, { context: { fnName: '->search()' } });
}
