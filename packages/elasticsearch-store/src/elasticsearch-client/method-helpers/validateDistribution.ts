import { ElasticsearchDistribution } from '@terascope/types';
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
