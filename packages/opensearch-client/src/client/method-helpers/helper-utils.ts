import { ElasticsearchDistribution, ClientMetadata } from '@terascope/types';

export function validateDistribution(
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (!validDistributionAndVersion(distribution, majorVersion)) {
        throw new Error(`Unsupported ${distribution} version: ${version}`);
    }
}

function validDistributionAndVersion(
    distribution: ElasticsearchDistribution,
    majorVersion: number
): boolean {
    const supportedOpenVersions = [1, 2, 3];

    return distribution === ElasticsearchDistribution.opensearch
        && supportedOpenVersions.includes(majorVersion);
}
