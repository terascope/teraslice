import { ElasticsearchDistribution, ESTypes, ClientMetadata } from '@terascope/types';

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

export function ensureTypeInMapping(body: ESTypes.IndexTemplateProperties | undefined) {
    if (body?.mappings?.properties) {
        const { properties } = body.mappings;

        body.mappings = { _doc: { properties } };
    }

    return body;
}