import { ElasticsearchDistribution } from '@terascope/types';
import type {
    TimeSpan,
    WaitForActiveShards,
    IndexTemplateProperties
} from './interfaces';
import type { Semver } from '../interfaces';

export interface IndicesCreateParams {
    index: string;
    include_type_name?: boolean;
    wait_for_active_shards?: WaitForActiveShards;
    timeout?: TimeSpan;
    master_timeout?: TimeSpan;
    body?: IndexTemplateProperties;
}

export interface IndicesCreateResponse {
    acknowledged: boolean;
    shards_acknowledged: boolean;
    index: string;
}

export function convertIndicesCreateParams(
    params: IndicesCreateParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                include_type_name,
                body,
                ...parsedParams
            } = params;

            return {
                aliases: body?.aliases,
                // ensure no type in mapping
                mappings: ensureNoType(body?.mappings),
                settings: body?.settings,
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                body,
                ...parsedParams
            } = params;

            return {
                include_type_name: true,
                body: ensureType(body),
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${distribution}`);
}

function ensureNoType(mappings: Record<string, any> | undefined) {
    if (mappings != null) {
        for (const [k, v] of Object.entries(mappings)) {
            if (k === 'properties') return { [k]: v };

            if (v.properties) return { properties: v.properties };
        }
    }
}

function ensureType(body: IndexTemplateProperties | undefined) {
    if (body?.mappings?.properties) {
        const { properties } = body.mappings;

        body.mappings = { _doc: { properties } };
    }

    return body;
}
