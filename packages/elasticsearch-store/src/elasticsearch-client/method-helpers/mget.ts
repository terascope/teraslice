import { ElasticsearchDistribution } from '@terascope/types';
import type { GetResponse } from './get';
import type { DistributionMetadata } from '../interfaces';

export interface MGetParams {
    index?: string;
    type?: string;
    stored_fields?: string | string[];
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
    _source?: string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    body: MGetBody
}

export interface MGetBody {
    docs?: MGetDocs[];
    ids?: string[];
}

interface MGetDocs {
    _id: string;
    _index?: string;
    _type?: string;
    _source?: boolean;
    routing?: string;
    source_includes?: string | string[];
    source_excludes?: string | string[];
    _stored_fields?: string | string[];
}

export interface MGetResponse {
    docs: GetResponse[]
}

export function convertMGetParams(
    params: MGetParams,
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
                type,
                body,
                ...parsedParams
            } = params;

            const returnParams: Record<string, any> = {
                ...parsedParams
            };

            if (body?.docs) {
                returnParams.docs = body.docs.map((doc) => {
                    delete doc._type;
                    return doc;
                });
            }

            if (body?.ids) {
                returnParams.ids = params.body.ids;
            }

            return returnParams;
        }

        if (majorVersion === 7) {
            const {
                type,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                type = '_doc',
                ...parsedParams
            } = params;

            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                type,
                ...parsedParams
            } = params;

            return parsedParams;
        }
    }

    throw new Error(`unsupported ${distribution} version ${version}`);
}
