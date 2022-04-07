import { debugLogger } from '@terascope/utils';
import got, { OptionsOfJSONResponseBody } from 'got';
import * as open from '@opensearch-project/opensearch';
import * as elastic from '@elastic/elasticsearch';
import { logWrapper } from './log-wrapper';
import {
    getUrl, getAuth, getHeaders
} from './utils';
import { MetadataResponse, ClientConfig } from './interfaces';

// TODO: handle cloud endpoint
export function createEndpointQuery(config: ClientConfig): OptionsOfJSONResponseBody {
    let endpoint = getUrl(config);
    const { username, password, https } = getAuth(config);
    const headers = getHeaders(config);

    // make sure url includes a protocol, follow link for why
    // https://nodejs.org/api/url.html#special-schemes
    if (!endpoint.includes('http')) {
        endpoint = `http://${endpoint}`;
    }

    const url = new URL(endpoint);

    if (password && username) {
        url.username = username;
        url.password = password;
    }

    const gotConfig: OptionsOfJSONResponseBody = {
        url: url.href,
        responseType: 'json',
        ...(https && { https }),
        ...{ headers }
    };

    return gotConfig;
}

export async function createClient(config: Record<string, any>, logger = debugLogger('elasticsearch-client')) {
    const gotOptions = createEndpointQuery(config);

    try {
        const { body } = await got<MetadataResponse>(gotOptions);

        if (body.version.distribution === 'opensearch') {
            // TODO: clean this up
            const openConfig = {
                ...config,
                node: gotOptions.url as string
            };
            const client = new open.Client(openConfig);
            const meta = {
                client_type: 'opensearch',
                version: body.version.number
            };
            // @ts-expect-error
            client.__meta = meta;

            return {
                client,
                log: logWrapper(logger),
            };
        }

        const elasticConfig = {
            ...config,
            node: gotOptions.url as string
        };
        const client = new elastic.Client(elasticConfig);
        const meta = {
            client_type: 'elasticsearch',
            version: body.version.number
        };
        // @ts-expect-error
        client.__meta = meta;
        return {
            client,
            log: logWrapper(logger)
        };
    } catch (err) {
        throw new Error(`Could not connect to ${gotOptions.url} to determine the correct elasticsearch client type`);
    }
}
