import 'jest-extended';
import { debugLogger, pDelay } from '@terascope/core-utils';
import { ClientParams } from '@terascope/types';
import {
    createClient, Client, ElasticsearchTestHelpers,
    convertToDocs
} from '../src/index.js';

const {
    populateIndex, cleanupIndex, waitForData,
    getTestENVClientInfo, EvenDateData,
} = ElasticsearchTestHelpers;

type EvenData = ElasticsearchTestHelpers.Data;
const { data, EvenDataType } = EvenDateData;

describe('client retry functionality from old api', () => {
    const index = 'wrapped_client_retry_test';
    const secondIndex = 'second_index_test';
    const testLogger = debugLogger('client-retry-test');

    const {
        host,
        ...clientMetadata
    } = getTestENVClientInfo();

    const config = { node: host };

    let client: Client;

    beforeAll(async () => {
        ({ client } = await createClient(config, testLogger));

        await Promise.all([
            cleanupIndex(client, index),
            cleanupIndex(client, secondIndex),
        ]);

        if (clientMetadata.version.split('.').length !== 3) {
            throw new Error(`Expected version to follow semver format (major.minor.patch) got ${clientMetadata.version}`);
        }

        await populateIndex(client, index, EvenDataType, data);
        await waitForData(client, index, 1000);
    }, 15000);

    describe('searchWithRetry', () => {
        it('should create a mew record', async () => {
            const query: ClientParams.SearchParams = { index, size: data.length };
            const response = await client.searchWithRetry<EvenData>(query);

            const results = convertToDocs<EvenData>(response);

            expect(results).toBeArrayOfSize(data.length);
        });
    });

    describe('createWithRetry', () => {
        it('should return valid results', async () => {
            const query: ClientParams.SearchParams = { index, size: data.length };
            const response = await client.searchWithRetry<EvenData>(query);

            const results = convertToDocs<EvenData>(response);

            expect(results).toBeArrayOfSize(data.length);
        });
    });

    describe('isIndexAvailable', () => {
        it('should return when an index exists', async () => {
            await expect(async () => client.isIndexAvailable(index)).resolves.not.toThrow();
        });

        it('will return when a index is made', async () => {
            const query: ClientParams.SearchParams = {
                index: secondIndex,
                size: 0
            };

            async function delayCreation() {
                await pDelay(100);
                await client.indices.create({ index: secondIndex });
            }
            // throws because index does not exists yet
            await expect(async () => client.search(query)).rejects.toThrow();

            await expect(async () => Promise.all([
                client.isIndexAvailable(secondIndex),
                delayCreation()
            ])).resolves.not.toThrow();
        });
    });

    describe('isClientConnected', () => {
        it.todo('should this even be here');
    });
});
