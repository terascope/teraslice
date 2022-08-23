import { ElasticsearchDistribution } from '@terascope/types';
import { MGetParams } from './interfaces';
import type { Semver } from '../interfaces';

export function convertMGetParams(
    params: MGetParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;

    const parsedParams: Record<string, any> = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            if (params.type) delete parsedParams.type;

            if (params.body.docs) {
                parsedParams.docs = params.body.docs.map((doc) => {
                    delete doc._type;
                    return doc;
                });
            }

            if (params.body.ids) {
                parsedParams.ids = params.body.ids;
            }

            delete parsedParams.body;

            return params;
        }

        if (majorVersion === 7 || majorVersion === 6) {
            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return parsedParams;
        }
    }

    throw new Error(`${distribution} version ${version} is not supported`);
}
