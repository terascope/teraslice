import { ElasticsearchDistribution } from '@terascope/types';
import { ReIndexParams } from './interfaces';
import type { Semver } from '../interfaces';

export function convertReIndexParams(
    params: ReIndexParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;

    const parsedParams: Record<string, any> = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            parsedParams.source = params.body.source;
            parsedParams.dest = params.body.dest;
            delete parsedParams.dest.type;

            return parsedParams;
        }

        if (majorVersion === 7) {
            return parsedParams;
        }

        if (majorVersion === 6) {
            delete parsedParams.scroll;
            delete parsedParams.max_docs;

            if (parsedParams.body.dest.type == null) parsedParams.body.dest.type = '_doc';

            return parsedParams;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return parsedParams;
        }
    }

    throw new Error(`${distribution} version ${version.join('.')} is not supported`);
}
