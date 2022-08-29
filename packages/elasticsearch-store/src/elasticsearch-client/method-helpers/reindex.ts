import { ElasticsearchDistribution } from '@terascope/types';
import {
    ConflictOptions,
    Remote,
    VersionType,
    OpType,
    ScriptLangs
} from './interfaces';
import type { Semver } from '../interfaces';

export interface ReIndexParams {
    refresh?: boolean;
    timeout?: string;
    wait_for_active_shards?: 'all' | number;
    wait_for_completion?: boolean;
    requests_per_second?: number;
    scroll?: string;
    slices?: number | string;
    max_docs?: number;
    body: ReIndexBody;
}

export interface ReIndexBody {
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
    params: ReIndexParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;

    const parsedParams: Record<string, any> = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            parsedParams.source = params.body.source;
            parsedParams.dest = params.body.dest;
            delete parsedParams.dest.type;

            return parsedParams;
        }

        if (majorVersion === 7) {
            return parsedParams;
        }

        if (majorVersion === 6) {
            delete parsedParams.scroll;
            delete parsedParams.max_docs;

            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version.join('.')}`);
}
