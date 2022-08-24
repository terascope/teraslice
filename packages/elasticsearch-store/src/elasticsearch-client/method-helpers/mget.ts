import { ElasticsearchDistribution } from '@terascope/types';
import type { GetQueryResponse } from './get';
import type { Semver } from '../interfaces';

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
    body: {
        docs?: MGetDocs[];
        ids?: string[];
    }
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
    docs: GetQueryResponse[]
}

export function convertMGetParams(
    params: MGetParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    const parsedParams: Record<string, any> = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            if (params.body.docs) {
                parsedParams.docs = params.body.docs.map((doc) => {
                    delete doc._type;
                    return doc;
                });
            }

            if (params.body.ids) {
                parsedParams.ids = params.body.ids;
            }

            delete parsedParams.type;
            delete parsedParams.body;

            return parsedParams;
        }

        if (majorVersion === 7 || majorVersion === 6) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version ${version}`);
}
