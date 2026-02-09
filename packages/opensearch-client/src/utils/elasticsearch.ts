import {
    get, isString, toNumber,
    cloneDeep, castArray, isEmpty,
    sortKeys
} from '@terascope/core-utils';
import {
    ESFieldType, ESTypeMapping, ClientMetadata,
    ElasticsearchDistribution, ESMapping
} from '@terascope/types';
import type { Client } from '../client/index.js';

export function getClientVersion(client: Client): number {
    const version = get(client, '__meta.version');

    if (version && isString(version)) {
        const [majorVersion] = version.split('.', 1);
        return toNumber(majorVersion);
    }

    return 2;
}

export function getClientMetadata(client: Client): ClientMetadata {
    const version = get(client, '__meta.version');
    const distribution = get(client, '__meta.distribution', ElasticsearchDistribution.opensearch);
    const [majorVersion = 2, minorVersion = 15] = version.split('.').map(toNumber);

    return {
        distribution,
        version,
        majorVersion,
        minorVersion
    };
}

export function isOpensearch(client: Client): boolean {
    const { distribution } = getClientMetadata(client);
    return distribution === ElasticsearchDistribution.opensearch;
}

export function isOpensearch1(client: Client): boolean {
    const { distribution, version: esVersion } = getClientMetadata(client);
    const parsedVersion = toNumber(esVersion.split('.', 1)[0]);

    return distribution === ElasticsearchDistribution.opensearch && parsedVersion === 1;
}

export function isOpensearch2(client: Client): boolean {
    const { distribution, version: esVersion } = getClientMetadata(client);
    const parsedVersion = toNumber(esVersion.split('.', 1)[0]);

    return distribution === ElasticsearchDistribution.opensearch && parsedVersion === 2;
}
export function isOpensearch3(client: Client): boolean {
    const { distribution, version: esVersion } = getClientMetadata(client);
    const parsedVersion = toNumber(esVersion.split('.', 1)[0]);

    return distribution === ElasticsearchDistribution.opensearch && parsedVersion === 3;
}

// TODO: move this logic over to datatype
export function fixMappingRequest(
    client: Client, _params: { body: ESMapping; name?: string; index?: string }, isTemplate: boolean
): any {
    if (!_params || !_params.body) {
        throw new Error('Invalid mapping request');
    }
    const params = cloneDeep(_params);
    const defaultParams: any = {};

    const version = getClientVersion(client);

    if (params.body.template != null) {
        if (isTemplate && params.body.index_patterns == null) {
            params.body.index_patterns = castArray(params.body.template).slice();
        }
        delete params.body.template;
    }

    // we do not support v5 anymore
    if (version !== 6) {
        const mappings = params?.body?.mappings || {};
        if (!mappings.properties && mappings._doc) {
            // esV8/osV2 seem to convert properly if mapping._doc.properties or mapping.properties
            // but esV7/osV1 only seem to work w/include_type_name if properties is under "_doc"
            // along w/metadata fields so set include_type_name if _doc & ensure metadata is in _doc
            defaultParams.include_type_name = true;

            if ((version === 7 || version === 1) && defaultParams.include_type_name) {
                // move any metadata fields to _doc
                const metadataFields = ['_index', '_id', '_source', '_size', '_doc_count', '_field_names', '_ignored', '_routing', '_meta', '_tier'];
                metadataFields.forEach((f) => {
                    if (mappings[f]) {
                        mappings._doc[f] = { ...mappings._doc[f], ...mappings[f] };
                        delete mappings[f];
                    }
                });
            }
        }

        // _all deprecated in esV6, esV8 & osV2 seems to strip automatically but esV7/osV1 don't
        if (version === 1) {
            if (mappings.include_type_name) {
                Object.values(mappings).forEach((typeMapping) => {
                    if (typeMapping && typeMapping._all) {
                        delete typeMapping._all;
                    }
                });
            } else if (mappings._all) {
                // _all might be at root mapping level if not include_type_name
                delete mappings._all;
            }
        }
    }

    return Object.assign({}, defaultParams, params);
}

/**
 * This is the return type for {@link getFlattenedNamesAndTypes}
*/
export type FlattenProperties = Record<string, [type: ESFieldType, extra?: string]>;

/**
 * This is useful for diffing the property mappings, the keys should be
 * sorted so this can be stringified and diffed.
*/
export function getFlattenedNamesAndTypes(config: ESTypeMapping): FlattenProperties {
    const output: FlattenProperties = Object.create(null);
    for (const field of Object.keys(config).sort()) {
        const {
            type: _type, properties, ...extra
        } = config[field as keyof ESTypeMapping] as Record<string, any>;

        // if there is no type, elasticsearch returns "undefined" for the type
        // but this will cause conflicts, we should set it to "object"
        const type: ESFieldType = _type == null ? 'object' : _type;

        const extraSorted = sortKeys(extra, { deep: true });

        output[field] = isEmpty(extraSorted)
            ? [type]
            : [
                type,
                JSON.stringify(extraSorted)
            ];

        // this means the object is nested
        if (properties) {
            const nestedOutput = getFlattenedNamesAndTypes(properties);
            for (const [nestedField, nestedConfig] of Object.entries(nestedOutput)) {
                output[`${field}.${nestedField}`] = nestedConfig;
            }
        }
    }
    return output;
}
