import { ElasticsearchDistribution } from '@terascope/types';
import type { Semver } from '../interfaces';

export function checkInfoDistribution(
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;

    if (!validDistributionAndVersion(distribution, majorVersion)) {
        throw new Error(`${distribution} version ${version} is not supported`);
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
