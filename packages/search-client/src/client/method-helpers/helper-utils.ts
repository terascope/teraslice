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
    const supportedOpenVersions = [1, 2, 3];

    return (distribution === ElasticsearchDistribution.elasticsearch
        && supportedEsVersions.includes(majorVersion))
    || (distribution === ElasticsearchDistribution.opensearch
        && supportedOpenVersions.includes(majorVersion));
}

export function ensureNoTypeInMapping(mappings: Record<string, any> | undefined) {
    const parsed: Record<string, any> = {};
    if (mappings != null) {
        for (const [k, v] of Object.entries(mappings)) {
            if (k === 'properties') parsed[k] = v;
            if (k === '_meta') parsed[k] = v;
            if (k === 'dynamic') parsed[k] = v;

            if (v.properties) parsed.properties = v.properties;
            if (v._meta) parsed._meta = v._meta;
            if (v.dynamic !== undefined) parsed.dynamic = v.dynamic;
        }
    }
    return parsed;
}

export function ensureTypeInMapping(body: ESTypes.IndexTemplateProperties | undefined) {
    if (body?.mappings?.properties) {
        const { properties } = body.mappings;

        body.mappings = { _doc: { properties } };
    }

    return body;
}
