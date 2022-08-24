import { ElasticsearchDistribution } from '@terascope/types';
import type { Semver } from '../interfaces';

export interface CountParams {
    index: string | string[];
    type?: string | string[];
    ignore_unavailable?: boolean;
    ignore_throttled?: boolean;
    allow_no_indices?: boolean;
    expand_wildcards?: 'open' | 'closed' | 'hidden' | 'none' | 'all';
    min_score?: number;
    preference?: string;
    routing?: string | string[];
    q?: string;
    analyzer?: string;
    analyze_wildcard?: boolean;
    lenient?: boolean;
    body?: Record<string, any>;
}

export interface CountResponse {
    count: number;
}

export function convertCountParams(
    params: Record<string, any>,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 7) {
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            return params;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}
