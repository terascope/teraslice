import { ElasticsearchDistribution } from '@terascope/types';
import {
    ConflictOptions,
    Remote,
    VersionType,
    OpType,
    ScriptLangs
} from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface ReindexParams {
    refresh?: boolean;
    timeout?: string;
    wait_for_active_shards?: 'all' | number;
    wait_for_completion?: boolean;
    requests_per_second?: number;
    scroll?: string;
    slices?: number | string;
    max_docs?: number;
    body: ReindexBody;
}

export interface ReindexBody {
    conflicts?: ConflictOptions;
    max_docs?: number;
    source: {
        index: string;
        query?: Record<string, any>;
        remote?: Remote,
        size?: number;
        slice?: {
            id?: number;
            max?: number;
        },
        _source?: boolean | string | string[];
    },
    dest: {
        index: string;
        version_type?: VersionType;
        op_type?: OpType;
        type?: string;
    },
    script?: {
        source?: string;
        lang?: ScriptLangs;
    }
}

export interface ReindexResponse {
    took: number;
    timed_out: boolean;
    total: number;
    updated: number;
    created: number;
    deleted: number;
    batches: number;
    noops: number;
    version_conflicts: number;
    retries: {
        bulk: number;
        search: number;
    };
    throttled_millis: number;
    requests_per_second: number;
    throttled_until_millis: number;
    failures: any[]
}

export function convertReIndexParams(
    params: ReindexParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                body,
                ...parsedParams
            } = params;

            delete body?.dest?.type;

            return {
                source: body?.source,
                dest: body?.dest,
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                scroll,
                max_docs,
                ...parsedParams
            } = params;

            if (parsedParams.body.dest.type == null) parsedParams.body.dest.type = '_doc';

            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}
