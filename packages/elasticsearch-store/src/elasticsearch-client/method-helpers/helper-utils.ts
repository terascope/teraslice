import { ElasticsearchDistribution } from '@terascope/types';
import { IndexTemplateProperties } from './interfaces';
import type { Semver } from '../interfaces';

export interface InfoResponse {
    name: string;
    cluster_name: string;
    cluster_uuid: string;
    version: {
        distribution?: string;
        number: string;
        build_flavor?: string;
        build_type: string;
        build_hash: string;
        build_date: string;
        build_snapshot: boolean;
        lucene_version: string;
        minimum_wire_compatibility_version: string;
        minimum_index_compatibility_version: string;
    },
    tagline: string;
}

export function validateDistribution(
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;

    if (!validDistributionAndVersion(distribution, majorVersion)) {
        throw new Error(`Unsupported ${distribution} version: ${version.join('.')}`);
    }
}

function validDistributionAndVersion(
    distribution: ElasticsearchDistribution,
    majorVersion: number
): boolean {
    const supportedEsVersions = [6, 7, 8];

    return (distribution === ElasticsearchDistribution.elasticsearch
        && supportedEsVersions.includes(majorVersion))
        || (distribution === ElasticsearchDistribution.opensearch && majorVersion === 1);
}

export function ensureNoTypeInMapping(mappings: Record<string, any> | undefined) {
    if (mappings != null) {
        for (const [k, v] of Object.entries(mappings)) {
            if (k === 'properties') return { [k]: v };

            if (v.properties) return { properties: v.properties };
        }
    }
}

export function ensureTypeInMapping(body: IndexTemplateProperties | undefined) {
    if (body?.mappings?.properties) {
        const { properties } = body.mappings;

        body.mappings = { _doc: { properties } };
    }

    return body;
}
