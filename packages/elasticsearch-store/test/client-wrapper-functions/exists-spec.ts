import { debugLogger } from '@terascope/utils';
import { ElasticsearchDistribution } from '@terascope/types';
import { createClient, WrappedClient } from '../../src';
import { Semver } from '../../src/elasticsearch-client';

import {
    ELASTICSEARCH_HOST,
    ELASTICSEARCH_VERSION,
    OPENSEARCH_HOST,
    OPENSEARCH_VERSION
} from '../helpers/config';

const testLogger = debugLogger('create-client-test');

const config = { node: '' };
let expectedDistribution: ElasticsearchDistribution;
let expectedVersion: string;

if (process.env.TEST_OPENSEARCH != null) {
    config.node = OPENSEARCH_HOST;
    expectedDistribution = ElasticsearchDistribution.opensearch;
    expectedVersion = OPENSEARCH_VERSION;
} else {
    config.node = ELASTICSEARCH_HOST;
    expectedDistribution = ElasticsearchDistribution.elasticsearch;
    expectedVersion = ELASTICSEARCH_VERSION;
}

const semver = expectedVersion.split('.').map((i) => parseInt(i, 10)) as Semver;

describe('exists', () => {
    it('should return true if the record exists', () => {
        const client = createClient(config, testLogger);

        const wrappedClient = new WrappedClient(client, expectedDistribution, semver);

        
    });
});
